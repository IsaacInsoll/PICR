import type { PingCoordinatorStatus } from './pingScanCoordinator.js';
import type { SuccessfulScanCoverage } from './scanCoverage.js';
import { picrPingV1PathIsWithin } from '@shared/ping/protocol.js';

export const MAX_PING_SOURCES = 16;
export const PING_RECONCILE_COOLDOWN_MS = 5 * 60 * 1000;

export interface PingSourceObservation {
  instanceId: string;
  name: string;
  pingVersion: string;
  receivedAt: Date;
  watchPrefix: string;
}

export interface PingSourceStatus {
  name: string;
  watchPrefix: string;
  instanceId: string;
  lastSeenAt: string;
  lastBatchAt: string | null;
  lastReconcileAt: string | null;
  hintsReceived: number;
  pingVersion: string;
  lastError: string | null;
}

export interface PingStatus {
  enabled: boolean;
  sources: PingSourceStatus[];
  coordinator: PingCoordinatorStatus;
}

interface InternalPingSourceStatus extends PingSourceStatus {
  reconciles: Array<SuccessfulScanCoverage & { path: string }>;
}

const sources = new Map<string, InternalPingSourceStatus>();

export class PingSourceLimitError extends Error {}
export class PingSourcePrefixError extends Error {}

export const observePingSource = (observation: PingSourceObservation): void => {
  const existing = sources.get(observation.name);
  if (!existing) {
    if (sources.size >= MAX_PING_SOURCES) {
      throw new PingSourceLimitError(
        `PICR Ping supports at most ${MAX_PING_SOURCES} sources`,
      );
    }
    sources.set(observation.name, {
      name: observation.name,
      watchPrefix: observation.watchPrefix,
      instanceId: observation.instanceId,
      lastSeenAt: observation.receivedAt.toISOString(),
      lastBatchAt: null,
      lastReconcileAt: null,
      hintsReceived: 0,
      pingVersion: observation.pingVersion,
      lastError: null,
      reconciles: [],
    });
    return;
  }

  if (
    existing.instanceId === observation.instanceId &&
    existing.watchPrefix !== observation.watchPrefix
  ) {
    throw new PingSourcePrefixError(
      `PICR Ping source "${observation.name}" changed watchPrefix within one instance`,
    );
  }

  if (existing.instanceId !== observation.instanceId) {
    existing.instanceId = observation.instanceId;
    existing.watchPrefix = observation.watchPrefix;
  }
  existing.lastSeenAt = observation.receivedAt.toISOString();
  existing.pingVersion = observation.pingVersion;
  existing.lastError = null;
};

export const recordPingBatch = (
  source: string,
  acceptedHints: number,
  receivedAt: Date,
): void => {
  const status = sources.get(source);
  if (!status) return;
  status.lastBatchAt = receivedAt.toISOString();
  status.hintsReceived += acceptedHints;
};

export const recordPingSourceError = (source: string, error: string): void => {
  const status = sources.get(source);
  if (status) status.lastError = error;
};

export const recordSuccessfulPingReconcile = (
  source: string,
  path: string,
  coverage: SuccessfulScanCoverage,
): void => {
  const status = sources.get(source);
  if (!status) return;
  status.lastReconcileAt = coverage.completedAt.toISOString();
  status.reconciles.push({ ...coverage, path });
  if (status.reconciles.length > 32) status.reconciles.shift();
};

export const getCoveringPingReconcile = (
  source: string,
  path: string,
): SuccessfulScanCoverage | null => {
  const status = sources.get(source);
  if (!status) return null;
  const coverage = status.reconciles
    .filter((candidate) => picrPingV1PathIsWithin(path, candidate.path))
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
    .at(0);
  return coverage
    ? { startedAt: coverage.startedAt, completedAt: coverage.completedAt }
    : null;
};

export const completedReconcileWithinCooldown = (
  source: string,
  path: string,
  now: Date,
): boolean => {
  const status = sources.get(source);
  if (!status) return false;
  return status.reconciles.some(
    (candidate) =>
      candidate.path === path &&
      now.getTime() - candidate.completedAt.getTime() <
        PING_RECONCILE_COOLDOWN_MS,
  );
};

export const getPingStatus = (
  enabled: boolean,
  coordinator: PingCoordinatorStatus,
): PingStatus => ({
  enabled,
  sources: [...sources.values()]
    .map((source) => ({
      name: source.name,
      watchPrefix: source.watchPrefix,
      instanceId: source.instanceId,
      lastSeenAt: source.lastSeenAt,
      lastBatchAt: source.lastBatchAt,
      lastReconcileAt: source.lastReconcileAt,
      hintsReceived: source.hintsReceived,
      pingVersion: source.pingVersion,
      lastError: source.lastError,
    }))
    .sort((a, b) => a.name.localeCompare(b.name)),
  coordinator,
});

export const resetPingStatusForTests = (): void => {
  sources.clear();
};
