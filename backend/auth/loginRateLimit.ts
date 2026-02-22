import { picrConfig } from '../config/picrConfig.js';
import { logger } from '../logger.js';

type LoginKeyType = 'ip' | 'user_ip';

interface AttemptState {
  windowStartMs: number;
  attempts: number;
  blockedUntilMs: number;
  blockLevel: number;
  lastSeenMs: number;
}

interface LoginRateLimitIdentity {
  ipAddress?: string;
  username?: string;
}

const attemptsByKey = new Map<string, AttemptState>();
let lastCleanupMs = 0;

const normalizeIp = (ipAddress?: string) => {
  const trimmed = ipAddress?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : 'unknown';
};

const normalizeUsername = (username?: string) => {
  const trimmed = username?.trim().toLowerCase();
  return trimmed && trimmed.length > 0 ? trimmed : '<empty>';
};

const keyFor = (type: LoginKeyType, identity: LoginRateLimitIdentity) => {
  const ip = normalizeIp(identity.ipAddress);
  if (type === 'ip') return `ip:${ip}`;
  return `user_ip:${normalizeUsername(identity.username)}@${ip}`;
};

const getState = (key: string, nowMs: number): AttemptState => {
  const existing = attemptsByKey.get(key);
  if (existing) {
    existing.lastSeenMs = nowMs;
    return existing;
  }

  const created: AttemptState = {
    windowStartMs: nowMs,
    attempts: 0,
    blockedUntilMs: 0,
    blockLevel: 0,
    lastSeenMs: nowMs,
  };
  attemptsByKey.set(key, created);
  return created;
};

const maybeResetWindow = (state: AttemptState, nowMs: number) => {
  const windowMs = (picrConfig.loginRateLimitWindowMinutes ?? 15) * 60 * 1000;
  if (nowMs - state.windowStartMs >= windowMs) {
    state.windowStartMs = nowMs;
    state.attempts = 0;
  }
};

const cleanupOldEntries = (nowMs: number) => {
  const cleanupIntervalMs = 5 * 60 * 1000;
  if (nowMs - lastCleanupMs < cleanupIntervalMs) return;
  lastCleanupMs = nowMs;

  const maxBlockMs =
    (picrConfig.loginRateLimitMaxBlockMinutes ?? 60) * 60 * 1000;
  const retentionMs = Math.max(maxBlockMs, 60 * 60 * 1000);

  for (const [key, state] of attemptsByKey) {
    if (
      nowMs - state.lastSeenMs > retentionMs &&
      nowMs > state.blockedUntilMs
    ) {
      attemptsByKey.delete(key);
    }
  }
};

const shouldBlockKey = (key: string, nowMs: number) => {
  const state = attemptsByKey.get(key);
  if (!state) return false;
  return nowMs < state.blockedUntilMs;
};

const limitForType = (type: LoginKeyType) => {
  if (type === 'ip') return picrConfig.loginRateLimitIpMaxAttempts ?? 30;
  return picrConfig.loginRateLimitUserIpMaxAttempts ?? 5;
};

const blockDurationMs = (nextBlockLevel: number) => {
  const baseMinutes = picrConfig.loginRateLimitBlockMinutes ?? 15;
  const maxMinutes = picrConfig.loginRateLimitMaxBlockMinutes ?? 60;
  const durationMinutes = Math.min(
    baseMinutes * 2 ** Math.max(0, nextBlockLevel - 1),
    maxMinutes,
  );
  return durationMinutes * 60 * 1000;
};

const recordFailureForKey = (
  type: LoginKeyType,
  key: string,
  nowMs: number,
  identity: LoginRateLimitIdentity,
) => {
  const state = getState(key, nowMs);
  maybeResetWindow(state, nowMs);

  state.attempts += 1;
  const limit = limitForType(type);
  if (state.attempts < limit) return;

  state.blockLevel += 1;
  state.blockedUntilMs = nowMs + blockDurationMs(state.blockLevel);
  state.attempts = 0;
  state.windowStartMs = nowMs;

  logger.warn('Login rate limit block applied', {
    ipAddress: normalizeIp(identity.ipAddress),
    username: normalizeUsername(identity.username),
    keyType: type,
    blockLevel: state.blockLevel,
    blockedUntil: new Date(state.blockedUntilMs).toISOString(),
  });
};

const clearState = (key: string) => {
  attemptsByKey.delete(key);
};

export const isLoginBlocked = (identity: LoginRateLimitIdentity) => {
  if (!picrConfig.loginRateLimitEnabled) return false;
  const nowMs = Date.now();
  cleanupOldEntries(nowMs);

  const ipKey = keyFor('ip', identity);
  const userIpKey = keyFor('user_ip', identity);
  return shouldBlockKey(ipKey, nowMs) || shouldBlockKey(userIpKey, nowMs);
};

export const recordFailedLoginAttempt = (identity: LoginRateLimitIdentity) => {
  if (!picrConfig.loginRateLimitEnabled) return;
  const nowMs = Date.now();
  cleanupOldEntries(nowMs);

  recordFailureForKey('ip', keyFor('ip', identity), nowMs, identity);
  recordFailureForKey('user_ip', keyFor('user_ip', identity), nowMs, identity);
};

export const recordSuccessfulLogin = (identity: LoginRateLimitIdentity) => {
  if (!picrConfig.loginRateLimitEnabled) return;
  clearState(keyFor('ip', identity));
  clearState(keyFor('user_ip', identity));
};
