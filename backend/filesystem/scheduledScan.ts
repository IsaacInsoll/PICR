import { and, asc, eq, gte } from 'drizzle-orm';
import type { IPicrConfiguration } from '../config/IPicrConfiguration.js';
import { db } from '../db/picrDb.js';
import { dbFile } from '../db/models/index.js';
import { log } from '../logger.js';
import { addToQueue } from './fileQueue.js';
import { scanFolderTree, type ScanFolderTreeResult } from './scanFolder.js';

export const SCHEDULED_SCAN_THUMB_LIMIT = 5000; // can be promoted to env var in future

type ScheduledTimer = ReturnType<typeof setInterval>;
type SetIntervalFn = (handler: () => void, timeout: number) => ScheduledTimer;
type ClearIntervalFn = (timer: ScheduledTimer) => void;

export interface ScheduledScanResultSummary {
  completed: boolean;
  cleanupRun: boolean;
  scanPasses: number;
  addedFiles: number;
  changedFiles: number;
  removedFiles: number;
  addedFolders: number;
  movedFiles: number;
  movedFolders: number;
  removedFolders: number;
  ignored: number;
  skippedEntries: number;
  unsettledFiles: number;
  unsettledFolders: number;
}

export interface ScheduledScanStatus {
  running: boolean;
  nextScanAt: string | null;
  lastStartedAt: string | null;
  lastCompletedAt: string | null;
  lastDurationMs: number | null;
  lastError: string | null;
  lastResult: ScheduledScanResultSummary | null;
}

let scheduledScanRunning = false;
const scheduledScanStatus: ScheduledScanStatus = {
  running: false,
  nextScanAt: null,
  lastStartedAt: null,
  lastCompletedAt: null,
  lastDurationMs: null,
  lastError: null,
  lastResult: null,
};

export const startScheduledScan = (
  config: Pick<IPicrConfiguration, 'scheduledScanHours'>,
  rootFolderId = 1,
  setIntervalFn: SetIntervalFn = setInterval,
  clearIntervalFn: ClearIntervalFn = clearInterval,
): (() => void) | undefined => {
  if (config.scheduledScanHours <= 0) {
    scheduledScanStatus.nextScanAt = null;
    return undefined;
  }

  const intervalMs = config.scheduledScanHours * 60 * 60 * 1000;
  scheduledScanStatus.nextScanAt = new Date(
    Date.now() + intervalMs,
  ).toISOString();
  log(
    'info',
    `🕒 Scheduled scan enabled every ${config.scheduledScanHours} hour(s)`,
    true,
  );

  const timer = setIntervalFn(() => {
    scheduledScanStatus.nextScanAt = new Date(
      Date.now() + intervalMs,
    ).toISOString();
    void runScheduledScan(rootFolderId);
  }, intervalMs);

  return () => {
    scheduledScanStatus.nextScanAt = null;
    clearIntervalFn(timer);
  };
};

export const runScheduledScan = async (rootFolderId = 1): Promise<void> => {
  if (scheduledScanRunning) {
    log(
      'warn',
      'Scheduled scan skipped because a previous scan is still running',
    );
    return;
  }

  scheduledScanRunning = true;
  scheduledScanStatus.running = true;
  const startedAt = new Date();
  const startedMs = Date.now();
  scheduledScanStatus.lastStartedAt = startedAt.toISOString();
  scheduledScanStatus.lastCompletedAt = null;
  scheduledScanStatus.lastDurationMs = null;
  scheduledScanStatus.lastError = null;
  scheduledScanStatus.lastResult = null;

  try {
    log('info', '🕒 Scheduled scan started', true);
    const result = await scanFolderTree(rootFolderId, {
      generateThumbs: false,
    });
    await queueScheduledThumbnails(startedAt, result);
    scheduledScanStatus.lastResult = resultSummary(result);
    log(
      result.completed ? 'info' : 'warn',
      `🕒 Scheduled scan ${result.completed ? 'complete' : 'finished with incomplete filesystem work'} after ${result.scanPasses} pass(es) in ${((Date.now() - startedMs) / 1000).toFixed(2)} seconds`,
      true,
    );
  } catch (error) {
    scheduledScanStatus.lastError = errorMessage(error);
    log(
      'error',
      `Scheduled scan failed; serving existing data: ${errorMessage(error)}`,
      true,
    );
  } finally {
    scheduledScanStatus.lastCompletedAt = new Date().toISOString();
    scheduledScanStatus.lastDurationMs = Date.now() - startedMs;
    scheduledScanStatus.running = false;
    scheduledScanRunning = false;
  }
};

export const getScheduledScanStatus = (): ScheduledScanStatus => ({
  ...scheduledScanStatus,
  lastResult: scheduledScanStatus.lastResult
    ? { ...scheduledScanStatus.lastResult }
    : null,
});

export const resetScheduledScanStateForTests = (): void => {
  scheduledScanRunning = false;
  scheduledScanStatus.running = false;
  scheduledScanStatus.nextScanAt = null;
  scheduledScanStatus.lastStartedAt = null;
  scheduledScanStatus.lastCompletedAt = null;
  scheduledScanStatus.lastDurationMs = null;
  scheduledScanStatus.lastError = null;
  scheduledScanStatus.lastResult = null;
};

const queueScheduledThumbnails = async (
  scanStartedAt: Date,
  result: Pick<ScanFolderTreeResult, 'addedFiles'>,
): Promise<void> => {
  if (result.addedFiles === 0) return;

  if (result.addedFiles > SCHEDULED_SCAN_THUMB_LIMIT) {
    log(
      'warn',
      `Scheduled scan deferred ${result.addedFiles} thumbnails because it exceeds the ${SCHEDULED_SCAN_THUMB_LIMIT} file limit`,
    );
    return;
  }

  const files = await db
    .select({ id: dbFile.id })
    .from(dbFile)
    .where(and(gte(dbFile.createdAt, scanStartedAt), eq(dbFile.exists, true)))
    .orderBy(asc(dbFile.name));

  for (const file of files) {
    addToQueue('generateThumbnails', { id: file.id });
  }
};

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const resultSummary = (
  result: ScanFolderTreeResult,
): ScheduledScanResultSummary => ({
  completed: result.completed,
  cleanupRun: result.cleanupRun,
  scanPasses: result.scanPasses,
  addedFiles: result.addedFiles,
  changedFiles: result.changedFiles,
  removedFiles: result.removedFiles,
  addedFolders: result.addedFolders,
  movedFiles: result.movedFiles,
  movedFolders: result.movedFolders,
  removedFolders: result.removedFolders,
  ignored: result.ignored,
  skippedEntries: result.skippedEntries,
  unsettledFiles: result.unsettledFiles,
  unsettledFolders: result.unsettledFolders,
});
