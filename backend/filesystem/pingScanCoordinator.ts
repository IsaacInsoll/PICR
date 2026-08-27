import { and, eq, gte, or, sql } from 'drizzle-orm';
import { db } from '../db/picrDb.js';
import { dbFile, dbFolder } from '../db/models/index.js';
import { delay } from '../helpers/delay.js';
import { log } from '../logger.js';
import { addToQueue } from './fileQueue.js';
import {
  SCAN_SETTLE_SECONDS,
  scanFolder,
  type ScanFolderOptions,
  type ScanFolderResult,
} from './scanFolder.js';
import type { SuccessfulScanCoverage } from './scanCoverage.js';

export const PING_MAX_IDLE_PASSES = 3;
export const PING_DEGRADED_BACKOFF_MS = 60_000;
export const PING_MAX_DEGRADED_BACKOFF_MS = 60 * 60_000;

export type PingCoordinatorState = 'idle' | 'settling' | 'cleanup' | 'degraded';

export interface PingCoordinatorStatus {
  state: PingCoordinatorState;
  pendingFolders: number;
  foldersScanned: number;
  lastError: string | null;
}

interface FolderResolution {
  folderId: number;
  relativePath: string;
  depth: number;
  exact: boolean;
}

interface ScanJob {
  folderId: number;
  scanRootPath: string;
  reconcileScopePath: string;
  depth: number;
  recursive: boolean;
  reconcileCallbacks: Set<(coverage: SuccessfulScanCoverage) => void>;
  reconcileStartedAt: Date | null;
}

interface QueuedScanRequest {
  reconcileScopePath: string;
  recursive: boolean;
  reconcileCallbacks: Set<(coverage: SuccessfulScanCoverage) => void>;
  reconcileStartedAt: Date | null;
  degradedAttempts: number;
  retryAt: number;
}

type Timer = ReturnType<typeof setTimeout>;

interface PingScanCoordinatorDependencies {
  clearTimeout: (timer: Timer) => void;
  delay: (milliseconds: number) => Promise<void>;
  enqueueThumbnails: (
    scanRootPath: string,
    passStartedAt: Date,
  ) => Promise<void>;
  log: typeof log;
  now: () => number;
  resolveFolder: (relativePath: string) => Promise<FolderResolution>;
  scanFolder: (
    folderId: number,
    options: ScanFolderOptions,
  ) => Promise<ScanFolderResult>;
  setTimeout: (handler: () => void, timeout: number) => Timer;
}

const emptyResult = (): ScanFolderResult => ({
  addedFiles: 0,
  changedFiles: 0,
  removedFiles: 0,
  addedFolders: 0,
  movedFiles: 0,
  movedFolders: 0,
  removedFolders: 0,
  ignored: 0,
  skippedEntries: 0,
  unavailableFolders: 0,
  unsettledFiles: 0,
  unsettledFolders: 0,
});

const mergeResults = (
  target: ScanFolderResult,
  source: ScanFolderResult,
): void => {
  for (const key of Object.keys(target) as Array<keyof ScanFolderResult>) {
    target[key] += source[key];
  }
};

const madeProgress = (result: ScanFolderResult): boolean =>
  result.addedFiles > 0 ||
  result.changedFiles > 0 ||
  result.removedFiles > 0 ||
  result.addedFolders > 0 ||
  result.movedFiles > 0 ||
  result.movedFolders > 0 ||
  result.removedFolders > 0;

const hasIncompleteWork = (result: ScanFolderResult): boolean =>
  result.unsettledFiles > 0 ||
  result.unsettledFolders > 0 ||
  result.unavailableFolders > 0;

const jobKey = (job: ScanJob): string =>
  job.recursive
    ? `recursive:${job.reconcileScopePath}`
    : `direct:${job.folderId}`;

const mergeJob = (target: ScanJob, source: ScanJob): void => {
  target.depth = Math.max(target.depth, source.depth);
  for (const callback of source.reconcileCallbacks) {
    target.reconcileCallbacks.add(callback);
  }
};

const requestKey = (request: QueuedScanRequest): string =>
  `${request.recursive ? 'recursive' : 'direct'}:${request.reconcileScopePath}`;

const retryDelay = (attempts: number): number =>
  Math.min(
    PING_DEGRADED_BACKOFF_MS * 2 ** Math.max(0, attempts - 1),
    PING_MAX_DEGRADED_BACKOFF_MS,
  );

const mergeRequest = (
  target: QueuedScanRequest,
  source: QueuedScanRequest,
): void => {
  target.degradedAttempts = Math.max(
    target.degradedAttempts,
    source.degradedAttempts,
  );
  target.retryAt = Math.max(target.retryAt, source.retryAt);
  target.reconcileStartedAt ??= source.reconcileStartedAt;
  for (const callback of source.reconcileCallbacks) {
    target.reconcileCallbacks.add(callback);
  }
};

interface JobResult {
  result: ScanFolderResult;
  unresolvedScope: string | null;
}

export class PingScanCoordinator {
  private readonly dependencies: PingScanCoordinatorDependencies;
  private readonly pendingRequests = new Map<string, QueuedScanRequest>();
  private cyclePromise: Promise<void> | null = null;
  private backoffTimer: Timer | null = null;
  private backoffTimerDueAt: number | null = null;
  private stopped = false;
  private status: PingCoordinatorStatus = {
    state: 'idle',
    pendingFolders: 0,
    foldersScanned: 0,
    lastError: null,
  };

  constructor(dependencies: Partial<PingScanCoordinatorDependencies> = {}) {
    this.dependencies = { ...defaultDependencies, ...dependencies };
  }

  enqueueDirectories(directories: string[]): Promise<void> {
    for (const directory of directories) {
      this.addPendingRequest({
        reconcileScopePath: directory,
        recursive: false,
        reconcileCallbacks: new Set(),
        reconcileStartedAt: null,
        degradedAttempts: 0,
        retryAt: 0,
      });
    }
    this.startCycle();
    return Promise.resolve();
  }

  enqueueReconcile(
    reconcilePath: string,
    onComplete?: (coverage: SuccessfulScanCoverage) => void,
  ): Promise<void> {
    this.addPendingRequest({
      reconcileScopePath: reconcilePath,
      recursive: true,
      reconcileCallbacks: new Set(onComplete ? [onComplete] : []),
      reconcileStartedAt: null,
      degradedAttempts: 0,
      retryAt: 0,
    });
    this.startCycle();
    return Promise.resolve();
  }

  getStatus(): PingCoordinatorStatus {
    return {
      ...this.status,
      pendingFolders: this.pendingRequests.size,
    };
  }

  async waitForCurrentCycle(): Promise<void> {
    await this.cyclePromise;
  }

  stop(): void {
    this.stopped = true;
    if (this.backoffTimer) {
      this.dependencies.clearTimeout(this.backoffTimer);
      this.backoffTimer = null;
      this.backoffTimerDueAt = null;
    }
  }

  private addPendingRequest(request: QueuedScanRequest): void {
    const key = requestKey(request);
    const existing = this.pendingRequests.get(key);
    if (existing) mergeRequest(existing, request);
    else this.pendingRequests.set(key, request);
    this.status.pendingFolders = this.pendingRequests.size;
  }

  private drainReadyRequests(): Map<string, QueuedScanRequest> {
    const now = this.dependencies.now();
    const ready = [...this.pendingRequests].filter(
      ([, request]) => request.retryAt <= now,
    );
    const fresh = ready.filter(([, request]) => request.degradedAttempts === 0);
    const selected = fresh.length > 0 ? fresh : ready;
    const drained = new Map(selected);
    for (const [key] of selected) this.pendingRequests.delete(key);
    this.status.pendingFolders = this.pendingRequests.size;
    return drained;
  }

  private foldFreshRequests(active: Map<string, QueuedScanRequest>): void {
    const now = this.dependencies.now();
    for (const [key, request] of this.pendingRequests) {
      if (request.degradedAttempts > 0 || request.retryAt > now) continue;
      const existing = active.get(key);
      if (existing) mergeRequest(existing, request);
      else active.set(key, request);
      this.pendingRequests.delete(key);
    }
    this.status.pendingFolders = this.pendingRequests.size;
  }

  private requeue(active: Map<string, QueuedScanRequest>): void {
    const now = this.dependencies.now();
    for (const request of active.values()) {
      request.degradedAttempts++;
      request.reconcileStartedAt = null;
      request.retryAt = now + retryDelay(request.degradedAttempts);
      this.addPendingRequest(request);
    }
  }

  private deferRetryForFreshWork(active: Map<string, QueuedScanRequest>): void {
    const now = this.dependencies.now();
    for (const request of active.values()) {
      request.reconcileStartedAt = null;
      request.retryAt = now + retryDelay(request.degradedAttempts);
      this.addPendingRequest(request);
    }
    this.status.state = 'degraded';
  }

  private hasFreshPendingRequests(): boolean {
    const now = this.dependencies.now();
    return [...this.pendingRequests.values()].some(
      (request) => request.degradedAttempts === 0 && request.retryAt <= now,
    );
  }

  private hasDegradedPendingRequests(): boolean {
    return [...this.pendingRequests.values()].some(
      (request) => request.degradedAttempts > 0,
    );
  }

  private clearBackoffTimer(): void {
    if (this.backoffTimer) this.dependencies.clearTimeout(this.backoffTimer);
    this.backoffTimer = null;
    this.backoffTimerDueAt = null;
  }

  private scheduleNextRetry(): void {
    const nextRetryAt = Math.min(
      ...[...this.pendingRequests.values()].map((request) => request.retryAt),
    );
    if (!Number.isFinite(nextRetryAt)) return;
    if (
      this.backoffTimer &&
      this.backoffTimerDueAt !== null &&
      this.backoffTimerDueAt <= nextRetryAt
    ) {
      return;
    }
    this.clearBackoffTimer();
    this.backoffTimerDueAt = nextRetryAt;
    this.backoffTimer = this.dependencies.setTimeout(
      () => {
        this.backoffTimer = null;
        this.backoffTimerDueAt = null;
        this.startCycle();
      },
      Math.max(0, nextRetryAt - this.dependencies.now()),
    );
  }

  private startCycle(): void {
    if (this.stopped || this.cyclePromise || this.pendingRequests.size === 0)
      return;

    const active = this.drainReadyRequests();
    if (active.size === 0) {
      this.scheduleNextRetry();
      return;
    }
    this.clearBackoffTimer();

    this.cyclePromise = this.runCycle(active).finally(() => {
      this.cyclePromise = null;
      if (this.pendingRequests.size > 0) this.startCycle();
    });
  }

  private async runCycle(
    active: Map<string, QueuedScanRequest>,
  ): Promise<void> {
    const retryCycle = [...active.values()].some(
      (request) => request.degradedAttempts > 0,
    );
    let settled = false;
    let idlePasses = 0;
    let unresolvedPasses = 0;
    let unresolvedScopes: string[] = [];
    let passResult = emptyResult();

    try {
      while (!this.stopped) {
        if (!retryCycle) this.foldFreshRequests(active);
        this.status.state = 'settling';
        const passStartedAt = new Date(this.dependencies.now());
        passResult = emptyResult();
        unresolvedScopes = [];

        for (const request of active.values()) {
          if (request.recursive) request.reconcileStartedAt ??= passStartedAt;
        }

        for (const job of (await this.resolveJobs(active)).values()) {
          const outcome = await this.runJob(job, passStartedAt, false);
          mergeResults(passResult, outcome.result);
          if (outcome.unresolvedScope) {
            unresolvedScopes.push(outcome.unresolvedScope);
          }
        }

        if (retryCycle && this.hasFreshPendingRequests()) {
          // Do not fold a new source/destination hint into a known-bad retry,
          // but also do not let retry cleanup run ahead of that fresh hint.
          // Defer the retry unchanged; the fresh lane runs next.
          this.deferRetryForFreshWork(active);
          return;
        }

        if (
          !hasIncompleteWork(passResult) &&
          (retryCycle || !this.hasFreshPendingRequests())
        ) {
          settled = true;
          break;
        }

        unresolvedPasses =
          unresolvedScopes.length > 0 ? unresolvedPasses + 1 : 0;
        if (unresolvedPasses >= PING_MAX_IDLE_PASSES) break;
        idlePasses = madeProgress(passResult) ? 0 : idlePasses + 1;
        if (idlePasses >= PING_MAX_IDLE_PASSES) break;
        await this.dependencies.delay(SCAN_SETTLE_SECONDS * 1000);
      }

      if (settled && !this.stopped) {
        this.status.state = 'cleanup';
        const cleanupResult = emptyResult();
        unresolvedScopes = [];
        const cleanupJobs = await this.resolveJobs(active);
        for (const job of cleanupJobs.values()) {
          const outcome = await this.runJob(
            job,
            new Date(this.dependencies.now()),
            true,
          );
          mergeResults(cleanupResult, outcome.result);
          if (outcome.unresolvedScope) {
            unresolvedScopes.push(outcome.unresolvedScope);
          }
        }
        if (hasIncompleteWork(cleanupResult)) {
          this.degrade(
            active,
            unresolvedScopes.length > 0
              ? unresolvedScopeMessage(unresolvedScopes)
              : incompleteScanMessage('cleanup', cleanupResult),
          );
          return;
        }
        for (const request of active.values()) {
          if (!request.recursive || !request.reconcileStartedAt) continue;
          const coverage = {
            startedAt: request.reconcileStartedAt,
            completedAt: new Date(this.dependencies.now()),
          };
          for (const callback of request.reconcileCallbacks) callback(coverage);
          request.reconcileCallbacks.clear();
        }
        if (this.hasDegradedPendingRequests()) {
          this.status.state = 'degraded';
        } else {
          this.status.state = 'idle';
          this.status.lastError = null;
        }
      } else if (!this.stopped) {
        this.degrade(
          active,
          unresolvedScopes.length > 0
            ? unresolvedScopeMessage(unresolvedScopes)
            : incompleteScanMessage('discovery', passResult),
        );
      }
    } catch (error) {
      this.degrade(active, errorMessage(error));
    }
  }

  private async resolveJobs(
    requests: Map<string, QueuedScanRequest>,
  ): Promise<Map<string, ScanJob>> {
    const jobs = new Map<string, ScanJob>();
    const resolutions = await Promise.all(
      [...requests.values()].map(async (request) => ({
        request,
        resolved: await this.dependencies.resolveFolder(
          request.reconcileScopePath,
        ),
      })),
    );

    for (const { request, resolved } of resolutions) {
      const job: ScanJob = {
        folderId: resolved.folderId,
        scanRootPath: resolved.relativePath,
        reconcileScopePath: request.reconcileScopePath,
        depth: resolved.depth,
        recursive: request.recursive,
        reconcileCallbacks: new Set(request.reconcileCallbacks),
        reconcileStartedAt: request.reconcileStartedAt,
      };
      const key = jobKey(job);
      const existing = jobs.get(key);
      if (existing) mergeJob(existing, job);
      else jobs.set(key, job);
    }
    return jobs;
  }

  private async runJob(
    job: ScanJob,
    passStartedAt: Date,
    removeMissing: boolean,
  ): Promise<JobResult> {
    const aggregate = emptyResult();

    if (job.recursive && job.scanRootPath !== job.reconcileScopePath) {
      if (removeMissing) {
        aggregate.unsettledFolders++;
        return {
          result: aggregate,
          unresolvedScope: job.reconcileScopePath,
        };
      }
      const materialiseResult = await this.scan(job, {
        depth: job.depth,
        removeMissing: false,
        scanExistingFolders: false,
      });
      mergeResults(aggregate, materialiseResult);
      await this.dependencies.enqueueThumbnails(
        job.scanRootPath,
        passStartedAt,
      );

      const resolved = await this.dependencies.resolveFolder(
        job.reconcileScopePath,
      );
      if (!resolved.exact) {
        aggregate.unsettledFolders++;
        return {
          result: aggregate,
          unresolvedScope: job.reconcileScopePath,
        };
      }
      job.folderId = resolved.folderId;
      job.scanRootPath = resolved.relativePath;
      job.depth = Number.MAX_SAFE_INTEGER;
    }

    const result = await this.scan(job, {
      depth: job.recursive ? Number.MAX_SAFE_INTEGER : job.depth,
      removeMissing,
      scanExistingFolders: job.recursive,
    });
    mergeResults(aggregate, result);
    if (!removeMissing) {
      await this.dependencies.enqueueThumbnails(
        job.scanRootPath,
        passStartedAt,
      );
    }
    return { result: aggregate, unresolvedScope: null };
  }

  private async scan(
    job: Pick<ScanJob, 'folderId'>,
    options: ScanFolderOptions,
  ): Promise<ScanFolderResult> {
    this.status.foldersScanned++;
    return this.dependencies.scanFolder(job.folderId, {
      ...options,
      generateThumbs: false,
    });
  }

  private degrade(
    active: Map<string, QueuedScanRequest>,
    message: string,
  ): void {
    this.status.state = 'degraded';
    this.status.lastError = message;
    this.requeue(active);
    this.dependencies.log('warn', message, true);
  }
}

const unresolvedScopeMessage = (scopes: string[]): string => {
  const uniqueScopes = [...new Set(scopes)].map((scope) => `"${scope}"`);
  return `PICR Ping could not resolve reconcile scope ${uniqueScopes.join(', ')}; verify PICR's media mount and PATH_PREFIX`;
};

const incompleteScanMessage = (
  phase: 'cleanup' | 'discovery',
  result: ScanFolderResult,
): string => {
  const details = [
    result.unavailableFolders > 0
      ? `${result.unavailableFolders} unavailable folder(s)`
      : null,
    result.unsettledFiles > 0
      ? `${result.unsettledFiles} unsettled file(s)`
      : null,
    result.unsettledFolders > 0
      ? `${result.unsettledFolders} unsettled folder(s)`
      : null,
  ].filter(Boolean);
  return details.length > 0
    ? `PICR Ping ${phase} could not fully read the scan scope: ${details.join(', ')}`
    : phase === 'cleanup'
      ? 'PICR Ping cleanup observed new unsettled filesystem work'
      : `PICR Ping scan stopped after ${PING_MAX_IDLE_PASSES} passes without progress`;
};

const resolveFolder = async (
  relativePath: string,
): Promise<FolderResolution> => {
  const segments = relativePath === '' ? [] : relativePath.split('/');

  for (let length = segments.length; length >= 0; length--) {
    const candidatePath = segments.slice(0, length).join('/');
    const folder =
      candidatePath === ''
        ? await db.query.dbFolder.findFirst({
            where: and(eq(dbFolder.id, 1), eq(dbFolder.exists, true)),
          })
        : await db.query.dbFolder.findFirst({
            where: and(
              eq(dbFolder.relativePath, candidatePath),
              eq(dbFolder.exists, true),
            ),
          });
    if (folder) {
      return {
        folderId: folder.id,
        relativePath: folder.relativePath ?? '',
        depth: segments.length - length,
        exact: length === segments.length,
      };
    }
  }

  throw new Error('PICR root folder is unavailable');
};

export const selectPingThumbnailFileIds = async (
  scanRootPath: string,
  passStartedAt: Date,
  database: Pick<typeof db, 'select'> = db,
): Promise<number[]> => {
  const scope =
    scanRootPath === ''
      ? undefined
      : or(
          eq(dbFile.relativePath, scanRootPath),
          sql<boolean>`starts_with(${dbFile.relativePath}, ${`${scanRootPath}/`})`,
        );
  const files = await database
    .select({ id: dbFile.id })
    .from(dbFile)
    .where(
      and(eq(dbFile.exists, true), gte(dbFile.updatedAt, passStartedAt), scope),
    );

  return files.map((file) => file.id);
};

const enqueueThumbnails = async (
  scanRootPath: string,
  passStartedAt: Date,
): Promise<void> => {
  for (const id of await selectPingThumbnailFileIds(
    scanRootPath,
    passStartedAt,
  )) {
    addToQueue('generateThumbnails', { id }, true);
  }
};

const defaultDependencies: PingScanCoordinatorDependencies = {
  clearTimeout,
  delay: async (milliseconds) => {
    await delay(milliseconds);
  },
  enqueueThumbnails,
  log,
  now: Date.now,
  resolveFolder,
  scanFolder,
  setTimeout,
};

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const pingScanCoordinator = new PingScanCoordinator();
