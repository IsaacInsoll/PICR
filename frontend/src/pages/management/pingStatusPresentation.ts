import { PICR_PING_STALE_AFTER_MS } from '@shared/ping/protocol.js';

export const PING_STALE_AFTER_MS = PICR_PING_STALE_AFTER_MS;

export type PingDisplayState =
  | 'awaiting'
  | 'connected'
  | 'degraded'
  | 'disabled'
  | 'error'
  | 'stale';

interface PingSourceLike {
  lastError?: string | null;
  lastSeenAt: string;
}

interface PingStatusLike {
  coordinator: {
    lastError?: string | null;
    state: string;
  };
  enabled: boolean;
  sources: PingSourceLike[];
}

export const pingSourceDisplayState = (
  source: PingSourceLike,
  nowMs: number,
): Exclude<PingDisplayState, 'awaiting' | 'degraded' | 'disabled'> => {
  if (source.lastError) return 'error';
  const lastSeenMs = Date.parse(source.lastSeenAt);
  if (
    !Number.isFinite(lastSeenMs) ||
    nowMs - lastSeenMs >= PING_STALE_AFTER_MS
  ) {
    return 'stale';
  }
  return 'connected';
};

export const pingDisplayState = (
  ping: PingStatusLike,
  nowMs: number,
): PingDisplayState => {
  if (!ping.enabled) return 'disabled';
  if (ping.coordinator.state === 'degraded' || ping.coordinator.lastError) {
    return 'degraded';
  }
  if (ping.sources.length === 0) return 'awaiting';
  const sourceStates = ping.sources.map((source) =>
    pingSourceDisplayState(source, nowMs),
  );
  if (sourceStates.includes('error')) return 'error';
  if (sourceStates.includes('stale')) return 'stale';
  return 'connected';
};
