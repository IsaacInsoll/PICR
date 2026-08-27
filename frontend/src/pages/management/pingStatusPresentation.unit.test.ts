import { describe, expect, test } from 'vitest';
import {
  PING_STALE_AFTER_MS,
  pingDisplayState,
  pingSourceDisplayState,
} from './pingStatusPresentation';

const now = Date.parse('2026-08-26T00:10:00.000Z');
const source = (
  overrides: Partial<{ lastError: string; lastSeenAt: string }> = {},
) => ({
  lastError: null,
  lastSeenAt: new Date(now - 60_000).toISOString(),
  ...overrides,
});
const ping = (
  overrides: Partial<{
    enabled: boolean;
    sources: ReturnType<typeof source>[];
    coordinator: { state: string; lastError: string | null };
  }> = {},
) => ({
  enabled: true,
  sources: [source()],
  coordinator: { state: 'idle', lastError: null },
  ...overrides,
});

describe('PICR Ping status presentation', () => {
  test('shows disabled and never-seen states distinctly', () => {
    expect(pingDisplayState(ping({ enabled: false }), now)).toBe('disabled');
    expect(pingDisplayState(ping({ sources: [] }), now)).toBe('awaiting');
  });

  test('shows a recently seen source as connected', () => {
    expect(pingDisplayState(ping(), now)).toBe('connected');
  });

  test('marks a source stale after three missed heartbeats', () => {
    const stale = source({
      lastSeenAt: new Date(now - PING_STALE_AFTER_MS).toISOString(),
    });
    expect(pingSourceDisplayState(stale, now)).toBe('stale');
    expect(pingDisplayState(ping({ sources: [stale] }), now)).toBe('stale');
  });

  test('surfaces one stale source in a multi-source deployment', () => {
    expect(
      pingDisplayState(
        ping({
          sources: [
            source(),
            source({
              lastSeenAt: new Date(now - PING_STALE_AFTER_MS - 1).toISOString(),
            }),
          ],
        }),
        now,
      ),
    ).toBe('stale');
  });

  test('coordinator degradation takes precedence over source freshness', () => {
    expect(
      pingDisplayState(
        ping({
          coordinator: { state: 'degraded', lastError: 'mount unavailable' },
        }),
        now,
      ),
    ).toBe('degraded');
  });

  test('surfaces source delivery errors independently', () => {
    expect(
      pingDisplayState(
        ping({ sources: [source({ lastError: 'prefix changed' })] }),
        now,
      ),
    ).toBe('error');
  });
});
