import { afterEach, expect, test, vi } from 'vitest';
import {
  isPingAuthBlocked,
  MAX_TRACKED_PING_AUTH_IPS,
  recordFailedPingAuth,
  resetPingAuthRateLimitForTests,
} from '../../backend/express/pingAuthRateLimit.js';

vi.mock('../../backend/logger.js', () => ({ log: vi.fn() }));

afterEach(() => {
  resetPingAuthRateLimitForTests();
});

test('bounds tracked authentication sources and retains the most recent source', () => {
  const now = Date.parse('2026-08-26T00:00:00.000Z');
  for (let index = 0; index < MAX_TRACKED_PING_AUTH_IPS; index++) {
    for (let attempt = 0; attempt < 10; attempt++) {
      recordFailedPingAuth(`source-${index}`, now);
    }
  }
  for (let attempt = 0; attempt < 10; attempt++) {
    recordFailedPingAuth('newest-source', now);
  }

  expect(isPingAuthBlocked('newest-source', now)).toBe(true);
  expect(isPingAuthBlocked('source-0', now)).toBe(false);
  expect(isPingAuthBlocked('source-1', now)).toBe(true);
});
