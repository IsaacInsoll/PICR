import { log } from '../logger.js';

const WINDOW_MS = 60_000;
const BLOCK_MS = 15 * 60_000;
const MAX_FAILURES = 10;
const RETENTION_MS = BLOCK_MS * 2;
const CLEANUP_INTERVAL_MS = 60_000;
export const MAX_TRACKED_PING_AUTH_IPS = 1024;

interface FailedAuthState {
  blockedUntil: number;
  failures: number;
  lastSeenAt: number;
  logged: boolean;
  windowStartedAt: number;
}

const failuresByIp = new Map<string, FailedAuthState>();
let nextCleanupAt = 0;

export const isPingAuthBlocked = (ip: string, now = Date.now()): boolean => {
  cleanup(now);
  const state = failuresByIp.get(ip);
  return Boolean(state && now < state.blockedUntil);
};

export const recordFailedPingAuth = (ip: string, now = Date.now()): void => {
  cleanup(now);
  const state = failuresByIp.get(ip) ?? {
    blockedUntil: 0,
    failures: 0,
    lastSeenAt: now,
    logged: false,
    windowStartedAt: now,
  };
  if (!failuresByIp.has(ip) && failuresByIp.size >= MAX_TRACKED_PING_AUTH_IPS) {
    const oldestIp = failuresByIp.keys().next().value;
    if (oldestIp !== undefined) failuresByIp.delete(oldestIp);
  }
  failuresByIp.delete(ip);
  failuresByIp.set(ip, state);
  state.lastSeenAt = now;
  if (now - state.windowStartedAt >= WINDOW_MS) {
    state.failures = 0;
    state.windowStartedAt = now;
    state.logged = false;
  }
  state.failures++;
  if (!state.logged) {
    log('warn', `PICR Ping authentication rejected from ${ip}`);
    state.logged = true;
  }
  if (state.failures >= MAX_FAILURES) state.blockedUntil = now + BLOCK_MS;
};

export const recordSuccessfulPingAuth = (ip: string): void => {
  failuresByIp.delete(ip);
};

export const resetPingAuthRateLimitForTests = (): void => {
  failuresByIp.clear();
  nextCleanupAt = 0;
};

const cleanup = (now: number): void => {
  if (now < nextCleanupAt) return;
  nextCleanupAt = now + CLEANUP_INTERVAL_MS;
  for (const [ip, state] of failuresByIp) {
    if (now - state.lastSeenAt >= RETENTION_MS && now >= state.blockedUntil) {
      failuresByIp.delete(ip);
    }
  }
};
