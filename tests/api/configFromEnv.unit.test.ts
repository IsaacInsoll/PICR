import { expect, test } from 'vitest';
import { resolveFileWatcherMode } from '../../backend/config/configFromEnv';

test('FILE_WATCHER overrides legacy USE_POLLING mode selection', () => {
  expect(resolveFileWatcherMode('off', true)).toBe('off');
  expect(resolveFileWatcherMode('native', true)).toBe('native');
  expect(resolveFileWatcherMode('polling', false)).toBe('polling');
});

test('USE_POLLING remains the fallback when FILE_WATCHER is unset', () => {
  expect(resolveFileWatcherMode(undefined, true)).toBe('polling');
  expect(resolveFileWatcherMode(undefined, false)).toBe('native');
});
