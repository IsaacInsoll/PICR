import { afterEach, expect, test, vi } from 'vitest';

const scanResult = (addedFiles: number) => ({
  addedFiles,
  changedFiles: 0,
  removedFiles: 0,
  addedFolders: 0,
  movedFiles: 0,
  movedFolders: 0,
  removedFolders: 0,
  ignored: 0,
  unsettledFiles: 0,
  unsettledFolders: 0,
  completed: true,
  cleanupRun: true,
  scanPasses: 1,
});

const loadScheduledScan = async ({
  files = [] as Array<{ id: number }>,
  scanFolderTreeImpl = async () => scanResult(files.length),
}: {
  files?: Array<{ id: number }>;
  scanFolderTreeImpl?: () => Promise<ReturnType<typeof scanResult>>;
} = {}) => {
  vi.resetModules();

  const orderBy = vi.fn(async () => files);
  const where = vi.fn(() => ({ orderBy }));
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));
  const scanFolderTree = vi.fn(scanFolderTreeImpl);
  const addToQueue = vi.fn();
  const log = vi.fn();

  vi.doMock('drizzle-orm', () => ({
    and: vi.fn((...args: unknown[]) => ({ and: args })),
    asc: vi.fn((arg: unknown) => ({ asc: arg })),
    eq: vi.fn((...args: unknown[]) => ({ eq: args })),
    gte: vi.fn((...args: unknown[]) => ({ gte: args })),
  }));
  vi.doMock('../../backend/db/picrDb.js', () => ({
    db: { select },
  }));
  vi.doMock('../../backend/db/models/index.js', () => ({
    dbFile: {
      createdAt: 'createdAt',
      exists: 'exists',
      id: 'id',
      name: 'name',
    },
  }));
  vi.doMock('../../backend/filesystem/fileQueue.js', () => ({
    addToQueue,
  }));
  vi.doMock('../../backend/filesystem/scanFolder.js', () => ({
    scanFolderTree,
  }));
  vi.doMock('../../backend/logger.js', () => ({
    log,
  }));

  const scheduledScan =
    await import('../../backend/filesystem/scheduledScan.js');
  scheduledScan.resetScheduledScanStateForTests();
  return {
    addToQueue,
    log,
    orderBy,
    scanFolderTree,
    scheduledScan,
    select,
  };
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

test('scheduled scan queues thumbnails for new files under the cap', async () => {
  const { addToQueue, scanFolderTree, scheduledScan } = await loadScheduledScan(
    {
      files: [{ id: 7 }, { id: 8 }],
    },
  );

  await scheduledScan.runScheduledScan(1);

  expect(scanFolderTree).toHaveBeenCalledWith(1, { generateThumbs: false });
  expect(addToQueue).toHaveBeenCalledWith('generateThumbnails', { id: 7 });
  expect(addToQueue).toHaveBeenCalledWith('generateThumbnails', { id: 8 });
});

test('scheduled scan defers thumbnails when the new-file count exceeds the cap', async () => {
  const overLimit = 5001;
  const { addToQueue, log, scheduledScan, select } = await loadScheduledScan({
    scanFolderTreeImpl: async () => scanResult(overLimit),
  });

  await scheduledScan.runScheduledScan(1);

  expect(select).not.toHaveBeenCalled();
  expect(addToQueue).not.toHaveBeenCalled();
  expect(log).toHaveBeenCalledWith(
    'warn',
    `Scheduled scan deferred ${overLimit} thumbnails because it exceeds the ${scheduledScan.SCHEDULED_SCAN_THUMB_LIMIT} file limit`,
  );
});

test('scheduled scan skips overlapping runs', async () => {
  let resolveScan: ((value: ReturnType<typeof scanResult>) => void) | undefined;
  const scanPromise = new Promise<ReturnType<typeof scanResult>>((resolve) => {
    resolveScan = resolve;
  });
  const { log, scanFolderTree, scheduledScan } = await loadScheduledScan({
    scanFolderTreeImpl: async () => scanPromise,
  });

  const first = scheduledScan.runScheduledScan(1);
  await Promise.resolve();
  await scheduledScan.runScheduledScan(1);
  resolveScan?.(scanResult(0));
  await first;

  expect(scanFolderTree).toHaveBeenCalledTimes(1);
  expect(log).toHaveBeenCalledWith(
    'warn',
    'Scheduled scan skipped because a previous scan is still running',
  );
});

test('scheduled scan resets its running flag after a failure so the next tick runs', async () => {
  const { log, scanFolderTree, scheduledScan } = await loadScheduledScan({
    scanFolderTreeImpl: async () => {
      throw new Error('NAS asleep');
    },
  });

  await expect(scheduledScan.runScheduledScan(1)).resolves.toBeUndefined();
  expect(log).toHaveBeenCalledWith(
    'error',
    'Scheduled scan failed; serving existing data: NAS asleep',
    true,
  );

  await scheduledScan.runScheduledScan(1);
  expect(scanFolderTree).toHaveBeenCalledTimes(2);
});

test('scheduled scan interval starts only when enabled and can be stopped', async () => {
  const { scheduledScan } = await loadScheduledScan();
  const timer = {} as ReturnType<typeof setInterval>;
  const setIntervalFn = vi.fn(() => timer);
  const clearIntervalFn = vi.fn();

  expect(
    scheduledScan.startScheduledScan(
      { scheduledScanHours: 0 },
      1,
      setIntervalFn,
      clearIntervalFn,
    ),
  ).toBeUndefined();

  const stop = scheduledScan.startScheduledScan(
    { scheduledScanHours: 2 },
    1,
    setIntervalFn,
    clearIntervalFn,
  );

  expect(setIntervalFn).toHaveBeenCalledWith(expect.any(Function), 7_200_000);
  stop?.();
  expect(clearIntervalFn).toHaveBeenCalledWith(timer);
});
