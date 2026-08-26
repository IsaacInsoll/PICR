import { expect, test } from 'vitest';
import { configFromEnv } from '../src/config.js';

test('dry run works without a PICR URL or token', () => {
  const config = configFromEnv({
    DRY_RUN: 'true',
    PICR_PING_NAME: 'studio-nas',
    WATCH_ROOT: '/media',
  });

  expect(config.dryRun).toBe(true);
  expect(config.picrUrl).toBeUndefined();
  expect(config.pingToken).toBeUndefined();
  expect(config.reconcileOnStart).toBe('auto');
});

test('normal mode requires a target and 64-character token', () => {
  expect(() => configFromEnv({ PICR_PING_NAME: 'studio-nas' })).toThrow(
    'PICR_URL is required',
  );
  expect(() =>
    configFromEnv({
      PICR_PING_NAME: 'studio-nas',
      PICR_URL: 'http://picr:6900/',
      PICR_PING_TOKEN: 'short',
    }),
  ).toThrow('at least 64 characters');
});

test('normalises target URLs and path prefixes', () => {
  const config = configFromEnv({
    PATH_PREFIX: 'Archive/Studio',
    PICR_PING_NAME: 'studio-nas',
    PICR_PING_TOKEN: 'a'.repeat(64),
    PICR_URL: 'http://picr:6900/base',
  });

  expect(config.pathPrefix).toBe('Archive/Studio');
  expect(config.picrUrl?.toString()).toBe('http://picr:6900/base/');
});
