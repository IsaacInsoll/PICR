import { expect, test } from 'vitest';
import {
  legacyConfigAdvisory,
  resolveFileWatcherMode,
  resolvePollingSeconds,
} from '../../backend/config/configFromEnv';
import { envSchema } from '../../backend/config/envSchema';

const requiredEnv = {
  BASE_URL: 'http://localhost:6900/',
  DATABASE_URL: 'postgres://user:pass@localhost:5432/picr',
};

test('FILE_WATCHER overrides legacy USE_POLLING mode selection', () => {
  expect(resolveFileWatcherMode('off', true)).toBe('off');
  expect(resolveFileWatcherMode('native', true)).toBe('native');
  expect(resolveFileWatcherMode('polling', false)).toBe('polling');
});

test('USE_POLLING remains the fallback when FILE_WATCHER is unset', () => {
  expect(resolveFileWatcherMode(undefined, true)).toBe('polling');
  expect(resolveFileWatcherMode(undefined, false)).toBe('native');
});

test('POLLING_SECONDS overrides legacy POLLING_INTERVAL conversion', () => {
  expect(resolvePollingSeconds(45, 300)).toBe(45);
});

test('POLLING_INTERVAL converts legacy 100ms units to seconds', () => {
  expect(resolvePollingSeconds(undefined, 300)).toBe(30);
  expect(resolvePollingSeconds(undefined, 20)).toBe(2);
});

test('polling seconds defaults to 20 when no polling interval env is set', () => {
  expect(resolvePollingSeconds(undefined, undefined)).toBe(20);
});

test('legacy config advisory translates deprecated vars', () => {
  expect(
    legacyConfigAdvisory({
      USE_POLLING: 'true',
      POLLING_INTERVAL: '300',
    }),
  ).toContain('POLLING_SECONDS=30');
});

test('legacy config advisory notes ignored legacy vars when modern vars are set', () => {
  const advisory = legacyConfigAdvisory({
    FILE_WATCHER: 'off',
    USE_POLLING: 'true',
    POLLING_SECONDS: '20',
    POLLING_INTERVAL: '300',
  });

  expect(advisory).toContain(
    'USE_POLLING is ignored because FILE_WATCHER is set',
  );
  expect(advisory).toContain(
    'POLLING_INTERVAL is ignored because POLLING_SECONDS is set',
  );
});

test('legacy config advisory maps non-standard truthy USE_POLLING like the parser does', () => {
  // castStringToBool coerces any non-'0'/'false' value truthy, so the advisory must
  // show polling for 'yes'/'no'/'off' rather than contradicting the resolved mode.
  expect(legacyConfigAdvisory({ USE_POLLING: 'yes' })).toContain(
    'FILE_WATCHER=polling',
  );
  expect(legacyConfigAdvisory({ USE_POLLING: 'off' })).toContain(
    'FILE_WATCHER=polling',
  );
  expect(legacyConfigAdvisory({ USE_POLLING: 'false' })).toContain(
    'FILE_WATCHER=native',
  );
});

test('legacy config advisory stays silent when only modern vars are used', () => {
  expect(
    legacyConfigAdvisory({ FILE_WATCHER: 'polling', POLLING_SECONDS: '20' }),
  ).toBeNull();
});

test('ON_VIEW_SCAN parses explicit modes and treats empty as unset', () => {
  expect(
    envSchema.parse({ ...requiredEnv, ON_VIEW_SCAN: 'direct_and_new' })
      .ON_VIEW_SCAN,
  ).toBe('direct_and_new');
  expect(
    envSchema.parse({ ...requiredEnv, ON_VIEW_SCAN: '' }).ON_VIEW_SCAN,
  ).toBeUndefined();
  expect(
    envSchema.safeParse({ ...requiredEnv, ON_VIEW_SCAN: 'recursive' }).success,
  ).toBe(false);
});

test('SCHEDULED_SCAN_HOURS accepts zero, positive integers, and empty unset', () => {
  expect(
    envSchema.parse({ ...requiredEnv, SCHEDULED_SCAN_HOURS: '0' })
      .SCHEDULED_SCAN_HOURS,
  ).toBe(0);
  expect(
    envSchema.parse({ ...requiredEnv, SCHEDULED_SCAN_HOURS: '24' })
      .SCHEDULED_SCAN_HOURS,
  ).toBe(24);
  expect(
    envSchema.parse({ ...requiredEnv, SCHEDULED_SCAN_HOURS: '' })
      .SCHEDULED_SCAN_HOURS,
  ).toBeUndefined();
  expect(
    envSchema.safeParse({ ...requiredEnv, SCHEDULED_SCAN_HOURS: '-1' }).success,
  ).toBe(false);
  expect(
    envSchema.safeParse({ ...requiredEnv, SCHEDULED_SCAN_HOURS: '1.5' })
      .success,
  ).toBe(false);
});

test('PICR_PING_TOKEN requires 64 characters and treats empty as unset', () => {
  expect(
    envSchema.parse({ ...requiredEnv, PICR_PING_TOKEN: '' }).PICR_PING_TOKEN,
  ).toBeUndefined();
  expect(
    envSchema.safeParse({ ...requiredEnv, PICR_PING_TOKEN: 'short' }).success,
  ).toBe(false);
  expect(
    envSchema.parse({ ...requiredEnv, PICR_PING_TOKEN: 'a'.repeat(64) })
      .PICR_PING_TOKEN,
  ).toBe('a'.repeat(64));
});
