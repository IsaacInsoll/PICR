import { afterEach, expect, test, vi } from 'vitest';
import {
  PING_DEGRADED_BACKOFF_MS,
  PING_MAX_IDLE_PASSES,
  PingScanCoordinator,
} from '../../backend/filesystem/pingScanCoordinator.js';
import type {
  ScanFolderOptions,
  ScanFolderResult,
} from '../../backend/filesystem/scanFolder.js';

const scanResult = (
  overrides: Partial<ScanFolderResult> = {},
): ScanFolderResult => ({
  addedFiles: 0,
  changedFiles: 0,
  removedFiles: 0,
  addedFolders: 0,
  movedFiles: 0,
  movedFolders: 0,
  removedFolders: 0,
  ignored: 0,
  skippedEntries: 0,
  unavailableFolders: 0,
  unsettledFiles: 0,
  unsettledFolders: 0,
  ...overrides,
});

const resolution = (
  folderId: number,
  relativePath: string,
  depth = 0,
  exact = depth === 0,
) => ({ folderId, relativePath, depth, exact });

const coordinatorFixture = ({
  resolveFolder = vi.fn(async (path: string) =>
    path === '' ? resolution(1, '') : resolution(10, path),
  ),
  scanFolder = vi.fn(async () => scanResult()),
}: {
  resolveFolder?: ReturnType<typeof vi.fn>;
  scanFolder?: ReturnType<typeof vi.fn>;
} = {}) => {
  let now = Date.parse('2026-08-26T00:00:00.000Z');
  let timerHandler: (() => void) | undefined;
  const enqueueThumbnails = vi.fn(async () => undefined);
  const setTimeout = vi.fn((handler: () => void) => {
    timerHandler = handler;
    return 1 as unknown as ReturnType<typeof globalThis.setTimeout>;
  });
  const coordinator = new PingScanCoordinator({
    clearTimeout: vi.fn(),
    delay: vi.fn(async () => undefined),
    enqueueThumbnails,
    log: vi.fn(),
    now: () => now,
    resolveFolder,
    scanFolder,
    setTimeout,
  });

  return {
    coordinator,
    enqueueThumbnails,
    resolveFolder,
    scanFolder,
    setNow: (value: number) => {
      now = value;
    },
    runTimer: () => timerHandler?.(),
    setTimeout,
  };
};

afterEach(() => {
  vi.restoreAllMocks();
});

test('retries unsettled discovery before running one cleanup pass', async () => {
  const scanFolder = vi
    .fn<(id: number, options: ScanFolderOptions) => Promise<ScanFolderResult>>()
    .mockResolvedValueOnce(scanResult({ unsettledFiles: 1 }))
    .mockResolvedValueOnce(scanResult({ addedFiles: 1 }))
    .mockResolvedValueOnce(scanResult());
  const { coordinator, enqueueThumbnails } = coordinatorFixture({ scanFolder });

  await coordinator.enqueueDirectories(['Weddings']);
  await coordinator.waitForCurrentCycle();

  expect(
    scanFolder.mock.calls.map(([, options]) => options.removeMissing),
  ).toEqual([false, false, true]);
  expect(enqueueThumbnails).toHaveBeenCalledTimes(2);
  expect(coordinator.getStatus()).toMatchObject({
    state: 'idle',
    foldersScanned: 3,
    pendingFolders: 0,
  });
});

test('accepts raw paths before database resolution completes', async () => {
  let finishResolution:
    | ((value: ReturnType<typeof resolution>) => void)
    | null = null;
  const resolveFolder = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<ReturnType<typeof resolution>>((resolve) => {
          finishResolution = resolve;
        }),
    )
    .mockResolvedValue(resolution(10, 'Archive'));
  const { coordinator, scanFolder } = coordinatorFixture({ resolveFolder });

  await coordinator.enqueueDirectories(['Archive']);

  expect(resolveFolder).toHaveBeenCalledWith('Archive');
  expect(scanFolder).not.toHaveBeenCalled();
  finishResolution?.(resolution(10, 'Archive'));
  await coordinator.waitForCurrentCycle();

  expect(scanFolder).toHaveBeenCalledTimes(2);
});

test('coalesces direct hints by folder while retaining the greatest depth', async () => {
  const resolveFolder = vi.fn(async (path: string) =>
    path.endsWith('/Child')
      ? resolution(10, 'Archive', 2, false)
      : resolution(10, 'Archive', 1, false),
  );
  const { coordinator, scanFolder } = coordinatorFixture({ resolveFolder });

  await coordinator.enqueueDirectories(['Archive/One', 'Archive/Two/Child']);
  await coordinator.waitForCurrentCycle();

  expect(scanFolder).toHaveBeenCalledTimes(2);
  expect(scanFolder).toHaveBeenNthCalledWith(
    1,
    10,
    expect.objectContaining({ depth: 2, removeMissing: false }),
  );
  expect(scanFolder).toHaveBeenNthCalledWith(
    2,
    10,
    expect.objectContaining({ depth: 2, removeMissing: true }),
  );
});

test('materialises a missing reconcile scope before recursively scanning it', async () => {
  const resolveFolder = vi
    .fn()
    .mockResolvedValueOnce(resolution(10, 'Archive', 2, false))
    .mockResolvedValue(resolution(12, 'Archive/Studio/Weddings'));
  const { coordinator, enqueueThumbnails, scanFolder } = coordinatorFixture({
    resolveFolder,
  });

  await coordinator.enqueueReconcile('Archive/Studio/Weddings');
  await coordinator.waitForCurrentCycle();

  expect(scanFolder).toHaveBeenNthCalledWith(
    1,
    10,
    expect.objectContaining({
      depth: 2,
      removeMissing: false,
      scanExistingFolders: false,
    }),
  );
  expect(scanFolder).toHaveBeenNthCalledWith(
    2,
    12,
    expect.objectContaining({
      depth: Number.MAX_SAFE_INTEGER,
      removeMissing: false,
      scanExistingFolders: true,
    }),
  );
  expect(scanFolder).toHaveBeenNthCalledWith(
    3,
    12,
    expect.objectContaining({ removeMissing: true }),
  );
  expect(enqueueThumbnails.mock.calls.map(([path]) => path)).toEqual([
    'Archive',
    'Archive/Studio/Weddings',
  ]);
});

test('does not clean up after an idle-pass abort and requeues behind backoff', async () => {
  const scanFolder = vi.fn(async () => scanResult({ unsettledFiles: 1 }));
  const {
    coordinator,
    scanFolder: scan,
    setTimeout,
  } = coordinatorFixture({
    scanFolder,
  });

  await coordinator.enqueueDirectories(['Growing']);
  await coordinator.waitForCurrentCycle();

  expect(scan).toHaveBeenCalledTimes(3);
  expect(scan.mock.calls.every(([, options]) => !options.removeMissing)).toBe(
    true,
  );
  expect(coordinator.getStatus()).toMatchObject({
    state: 'degraded',
    pendingFolders: 1,
  });
  expect(setTimeout).toHaveBeenCalledWith(
    expect.any(Function),
    PING_DEGRADED_BACKOFF_MS,
  );
  coordinator.stop();
});

test('a thrown scan is retained and re-resolved when the backoff timer fires', async () => {
  const scanFolder = vi
    .fn<(id: number, options: ScanFolderOptions) => Promise<ScanFolderResult>>()
    .mockRejectedValueOnce(new Error('mount unavailable'))
    .mockResolvedValue(scanResult());
  const resolveFolder = vi
    .fn()
    .mockResolvedValueOnce(resolution(10, 'Archive'))
    .mockResolvedValue(resolution(20, 'Archive'));
  const {
    coordinator,
    runTimer,
    scanFolder: scan,
    setNow,
  } = coordinatorFixture({ resolveFolder, scanFolder });

  await coordinator.enqueueDirectories(['Archive']);
  await coordinator.waitForCurrentCycle();
  expect(coordinator.getStatus()).toMatchObject({
    state: 'degraded',
    pendingFolders: 1,
    lastError: 'mount unavailable',
  });

  setNow(Date.parse('2026-08-26T00:01:00.000Z'));
  runTimer();
  await coordinator.waitForCurrentCycle();

  expect(scan).toHaveBeenCalledTimes(3);
  expect(scan.mock.calls.map(([folderId]) => folderId)).toEqual([10, 20, 20]);
  expect(coordinator.getStatus()).toMatchObject({
    state: 'idle',
    pendingFolders: 0,
    lastError: null,
  });
});

test('reports unresolved reconcile scopes and exponentially backs off retries', async () => {
  const resolveFolder = vi.fn(async () => resolution(10, 'Archive', 2, false));
  const { coordinator, runTimer, setNow, setTimeout } = coordinatorFixture({
    resolveFolder,
  });

  await coordinator.enqueueReconcile('Archive/Missing/Scope');
  await coordinator.waitForCurrentCycle();

  expect(coordinator.getStatus()).toMatchObject({
    state: 'degraded',
    pendingFolders: 1,
    lastError:
      'PICR Ping could not resolve reconcile scope "Archive/Missing/Scope"; verify PICR\'s media mount and PATH_PREFIX',
  });
  expect(resolveFolder).toHaveBeenCalledTimes(PING_MAX_IDLE_PASSES * 2);
  expect(setTimeout).toHaveBeenLastCalledWith(
    expect.any(Function),
    PING_DEGRADED_BACKOFF_MS,
  );

  setNow(Date.parse('2026-08-26T00:01:00.000Z'));
  runTimer();
  await coordinator.waitForCurrentCycle();

  expect(setTimeout).toHaveBeenLastCalledWith(
    expect.any(Function),
    PING_DEGRADED_BACKOFF_MS * 2,
  );
  coordinator.stop();
});

test('does not record reconcile coverage when its scan root is unavailable', async () => {
  const onComplete = vi.fn();
  const scanFolder = vi.fn(async () => scanResult({ unavailableFolders: 1 }));
  const { coordinator } = coordinatorFixture({ scanFolder });

  await coordinator.enqueueReconcile('Archive', onComplete);
  await coordinator.waitForCurrentCycle();

  expect(onComplete).not.toHaveBeenCalled();
  expect(coordinator.getStatus()).toMatchObject({
    state: 'degraded',
    pendingFolders: 1,
    lastError:
      'PICR Ping discovery could not fully read the scan scope: 1 unavailable folder(s)',
  });
  coordinator.stop();
});

test('records reconcile coverage when individual filesystem entries were safely skipped', async () => {
  const onComplete = vi.fn();
  const scanFolder = vi.fn(async () => scanResult({ skippedEntries: 1 }));
  const { coordinator } = coordinatorFixture({ scanFolder });

  await coordinator.enqueueReconcile('Archive', onComplete);
  await coordinator.waitForCurrentCycle();

  expect(onComplete).toHaveBeenCalledOnce();
  expect(coordinator.getStatus()).toMatchObject({
    state: 'idle',
    pendingFolders: 0,
    lastError: null,
  });
  expect(scanFolder).toHaveBeenCalledTimes(2);
});

test('fresh hints run immediately while a degraded reconcile waits for retry', async () => {
  const resolveFolder = vi.fn(async (path: string) =>
    path === 'Broken/Scope'
      ? resolution(10, 'Broken', 1, false)
      : resolution(20, path),
  );
  const { coordinator, scanFolder, setTimeout } = coordinatorFixture({
    resolveFolder,
  });

  await coordinator.enqueueReconcile('Broken/Scope');
  await coordinator.waitForCurrentCycle();

  expect(coordinator.getStatus()).toMatchObject({
    state: 'degraded',
    pendingFolders: 1,
  });
  expect(setTimeout).toHaveBeenLastCalledWith(
    expect.any(Function),
    PING_DEGRADED_BACKOFF_MS,
  );

  await coordinator.enqueueDirectories(['Healthy']);
  await coordinator.waitForCurrentCycle();

  const healthyScans = scanFolder.mock.calls.filter(
    ([folderId]) => folderId === 20,
  );
  expect(healthyScans.map(([, options]) => options.removeMissing)).toEqual([
    false,
    true,
  ]);
  expect(coordinator.getStatus()).toMatchObject({
    state: 'degraded',
    pendingFolders: 1,
    lastError:
      'PICR Ping could not resolve reconcile scope "Broken/Scope"; verify PICR\'s media mount and PATH_PREFIX',
  });
  coordinator.stop();
});

test('a fresh hint preempts cleanup when it arrives during a retry cycle', async () => {
  let now = Date.parse('2026-08-26T00:00:00.000Z');
  let releaseRetry: (() => void) | undefined;
  let notifyRetryStarted: (() => void) | undefined;
  const retryStarted = new Promise<void>((resolve) => {
    notifyRetryStarted = resolve;
  });
  const retryGate = new Promise<void>((resolve) => {
    releaseRetry = resolve;
  });
  const resolveFolder = vi.fn(async (path: string) => {
    if (path === 'Broken/Scope') {
      if (now >= Date.parse('2026-08-26T00:01:00.000Z')) {
        notifyRetryStarted?.();
        await retryGate;
      }
      return resolution(10, 'Broken', 1, false);
    }
    return resolution(20, path);
  });
  const fixture = coordinatorFixture({ resolveFolder });
  const { coordinator, runTimer, scanFolder } = fixture;

  await coordinator.enqueueReconcile('Broken/Scope');
  await coordinator.waitForCurrentCycle();

  now = Date.parse('2026-08-26T00:01:00.000Z');
  fixture.setNow(now);
  runTimer();
  await retryStarted;
  await coordinator.enqueueDirectories(['Healthy']);
  releaseRetry?.();
  await coordinator.waitForCurrentCycle();
  await coordinator.waitForCurrentCycle();

  const healthyScans = scanFolder.mock.calls.filter(
    ([folderId]) => folderId === 20,
  );
  expect(healthyScans.map(([, options]) => options.removeMissing)).toEqual([
    false,
    true,
  ]);
  expect(coordinator.getStatus()).toMatchObject({
    state: 'degraded',
    pendingFolders: 1,
  });
  coordinator.stop();
});

test('a hint arriving during cleanup runs in the next cycle', async () => {
  let releaseCleanup: (() => void) | undefined;
  const cleanupStarted = new Promise<void>((resolve) => {
    releaseCleanup = resolve;
  });
  let notifyCleanupStarted: (() => void) | undefined;
  const cleanupIsRunning = new Promise<void>((resolve) => {
    notifyCleanupStarted = resolve;
  });
  const scanFolder = vi.fn(
    async (_folderId: number, options: ScanFolderOptions) => {
      if (options.removeMissing && scanFolder.mock.calls.length === 2) {
        notifyCleanupStarted?.();
        await cleanupStarted;
      }
      return scanResult();
    },
  );
  const resolveFolder = vi.fn(async (path: string) =>
    path === 'One' ? resolution(10, 'One') : resolution(20, 'Two'),
  );
  const { coordinator } = coordinatorFixture({ resolveFolder, scanFolder });

  await coordinator.enqueueDirectories(['One']);
  await cleanupIsRunning;
  await coordinator.enqueueDirectories(['Two']);
  expect(coordinator.getStatus().pendingFolders).toBe(1);
  releaseCleanup?.();
  await coordinator.waitForCurrentCycle();
  await coordinator.waitForCurrentCycle();

  expect(scanFolder.mock.calls.map(([folderId]) => folderId)).toEqual([
    10, 10, 20, 20,
  ]);
});
