import { afterEach, expect, test } from 'vitest';
import {
  mediaScanTaskStatus,
  resetMediaScanActivityForTests,
  withMediaScanActivity,
} from '../../backend/filesystem/mediaScanActivity.js';

const deferred = () => {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, reject, resolve };
};

afterEach(() => {
  resetMediaScanActivityForTests();
});

test('activity appears only after one operation crosses the minimum age', async () => {
  let now = 1_000;
  resetMediaScanActivityForTests(() => now);
  const operation = deferred();
  const running = withMediaScanActivity(() => operation.promise);

  now = 2_499;
  expect(mediaScanTaskStatus()).toBeNull();
  now = 2_500;
  expect(mediaScanTaskStatus()).toMatchObject({
    id: 'media-scan',
    name: 'Checking for new media…',
  });

  operation.resolve();
  await running;
  expect(mediaScanTaskStatus()).toBeNull();
});

test('overlapping short operations remain hidden despite continuous aggregate activity', async () => {
  let now = 0;
  resetMediaScanActivityForTests(() => now);
  const first = deferred();
  const second = deferred();
  const firstRunning = withMediaScanActivity(() => first.promise);

  now = 1_000;
  const secondRunning = withMediaScanActivity(() => second.promise);
  now = 1_499;
  first.resolve();
  await firstRunning;

  now = 2_000;
  expect(mediaScanTaskStatus()).toBeNull();
  second.resolve();
  await secondRunning;
  expect(mediaScanTaskStatus()).toBeNull();
});

test('concurrent substantive operations produce one task until both finish', async () => {
  let now = 0;
  resetMediaScanActivityForTests(() => now);
  const first = deferred();
  const second = deferred();
  const firstRunning = withMediaScanActivity(() => first.promise);
  const secondRunning = withMediaScanActivity(() => second.promise);

  now = 1_500;
  expect(mediaScanTaskStatus()?.id).toBe('media-scan');
  first.resolve();
  await firstRunning;
  expect(mediaScanTaskStatus()?.id).toBe('media-scan');
  second.resolve();
  await secondRunning;
  expect(mediaScanTaskStatus()).toBeNull();
});

test('rejected operations always clear their activity token', async () => {
  let now = 0;
  resetMediaScanActivityForTests(() => now);
  const operation = deferred();
  const running = withMediaScanActivity(() => operation.promise);

  now = 1_500;
  expect(mediaScanTaskStatus()?.id).toBe('media-scan');
  operation.reject(new Error('scan failed'));
  await expect(running).rejects.toThrow('scan failed');
  expect(mediaScanTaskStatus()).toBeNull();
});
