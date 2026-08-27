import type { IncomingMessage } from 'node:http';
import { afterEach, expect, test, vi } from 'vitest';
import type { OnViewScanMode } from '../../backend/config/IPicrConfiguration';
import type { ScanFolderResult } from '../../backend/filesystem/scanFolder.js';

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

interface LoadOptions {
  activityNow?: () => number;
  delayImpl?: (milliseconds: number) => Promise<void>;
  folderPath?: string | null;
}

const loadOnViewScan = async (
  onViewScanMode: OnViewScanMode = 'direct',
  scanFolderImpl: () => Promise<ScanFolderResult> = async () => scanResult(),
  options: LoadOptions = {},
) => {
  vi.resetModules();

  const scanFolder = vi.fn(scanFolderImpl);
  const enqueueScanThumbnails = vi.fn(async () => undefined);
  const settleDelay = vi.fn(options.delayImpl ?? (async () => undefined));
  const dbFolderForId = vi.fn(async (id: number) => ({
    id,
    relativePath: options.folderPath ?? 'Clients/Smith',
  }));
  const log = vi.fn();
  const picrConfig = { onViewScanMode };

  vi.doMock('../../backend/filesystem/scanFolder.js', () => ({
    SCAN_SETTLE_SECONDS: 10,
    scanFolder,
  }));
  vi.doMock('../../backend/filesystem/scanThumbnails.js', () => ({
    enqueueScanThumbnails,
  }));
  vi.doMock('../../backend/db/picrDb.js', () => ({ dbFolderForId }));
  vi.doMock('../../backend/helpers/delay.js', () => ({ delay: settleDelay }));
  vi.doMock('../../backend/config/picrConfig.js', () => ({ picrConfig }));
  vi.doMock('../../backend/logger.js', () => ({ log }));

  const mediaScanActivity =
    await import('../../backend/filesystem/mediaScanActivity.js');
  mediaScanActivity.resetMediaScanActivityForTests(options.activityNow);
  const onViewScan = await import('../../backend/filesystem/onViewScan.js');
  onViewScan.resetOnViewScanStateForTests();
  return {
    enqueueScanThumbnails,
    log,
    mediaScanActivity,
    onViewScan,
    scanFolder,
    settleDelay,
  };
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

test('on-view scan depth maps mode and keeps root direct-only', async () => {
  const { onViewScan } = await loadOnViewScan();

  expect(onViewScan.onViewScanOptions(2, 'off')).toBeUndefined();
  expect(onViewScan.onViewScanOptions(2, 'direct')).toEqual({
    depth: 0,
    generateThumbs: false,
    scanExistingFolders: false,
  });
  expect(onViewScan.onViewScanOptions(2, 'direct_and_new')).toEqual({
    depth: 1,
    generateThumbs: false,
    scanExistingFolders: false,
  });
  expect(onViewScan.onViewScanOptions(2, 'one_level')).toEqual({
    depth: 1,
    generateThumbs: false,
    scanExistingFolders: true,
  });
  expect(onViewScan.onViewScanOptions(1, 'one_level')).toEqual({
    depth: 0,
    generateThumbs: false,
    scanExistingFolders: false,
  });
});

test('stable on-view work scans once and queues touched thumbnails', async () => {
  const { enqueueScanThumbnails, onViewScan, scanFolder, settleDelay } =
    await loadOnViewScan('direct');

  const started = onViewScan.startOnViewScan(2, 1_000);
  expect(started.status).toBe('started');
  if (started.status === 'started') await started.promise;

  expect(scanFolder).toHaveBeenCalledOnce();
  expect(scanFolder).toHaveBeenCalledWith(2, {
    depth: 0,
    generateThumbs: false,
    scanExistingFolders: false,
  });
  expect(enqueueScanThumbnails).toHaveBeenCalledWith(
    'Clients/Smith',
    expect.any(Date),
  );
  expect(settleDelay).not.toHaveBeenCalled();
});

test('unsettled on-view work waits once and queues thumbnails from both passes', async () => {
  let pass = 0;
  const { enqueueScanThumbnails, onViewScan, scanFolder, settleDelay } =
    await loadOnViewScan('direct_and_new', async () =>
      scanResult(pass++ === 0 ? { unsettledFiles: 1 } : { addedFiles: 1 }),
    );

  const started = onViewScan.startOnViewScan(2, 1_000);
  expect(started.status).toBe('started');
  if (started.status === 'started') await started.promise;

  expect(settleDelay).toHaveBeenCalledOnce();
  expect(settleDelay).toHaveBeenCalledWith(10_000);
  expect(scanFolder).toHaveBeenCalledTimes(2);
  expect(enqueueScanThumbnails).toHaveBeenCalledTimes(2);
});

test('on-view activity remains visible across its settle delay and second pass', async () => {
  let now = 0;
  let finishDelay!: () => void;
  const delayed = new Promise<void>((resolve) => {
    finishDelay = resolve;
  });
  let pass = 0;
  const { mediaScanActivity, onViewScan, settleDelay } = await loadOnViewScan(
    'direct',
    async () => scanResult(pass++ === 0 ? { unsettledFiles: 1 } : {}),
    {
      activityNow: () => now,
      delayImpl: async () => delayed,
    },
  );

  const started = onViewScan.startOnViewScan(2, 0);
  expect(started.status).toBe('started');
  await vi.waitFor(() => expect(settleDelay).toHaveBeenCalledOnce());

  now = 1_500;
  expect(mediaScanActivity.mediaScanTaskStatus()?.id).toBe('media-scan');
  finishDelay();
  if (started.status === 'started') await started.promise;
  expect(mediaScanActivity.mediaScanTaskStatus()).toBeNull();
});

test('unavailable folders do not trigger the settle retry', async () => {
  const { enqueueScanThumbnails, onViewScan, scanFolder, settleDelay } =
    await loadOnViewScan('direct', async () =>
      scanResult({ unavailableFolders: 1 }),
    );

  const started = onViewScan.startOnViewScan(2, 1_000);
  expect(started.status).toBe('started');
  if (started.status === 'started') await started.promise;

  expect(scanFolder).toHaveBeenCalledOnce();
  expect(enqueueScanThumbnails).toHaveBeenCalledOnce();
  expect(settleDelay).not.toHaveBeenCalled();
});

test('on-view scan starts only once per in-flight scan and cooldown window', async () => {
  let finishFirstScan!: () => void;
  const firstScan = new Promise<void>((resolve) => {
    finishFirstScan = resolve;
  });
  const { onViewScan, scanFolder } = await loadOnViewScan(
    'direct',
    async () => {
      await firstScan;
      return scanResult();
    },
  );

  const first = onViewScan.startOnViewScan(2, 1_000);
  expect(first.status).toBe('started');
  expect(onViewScan.startOnViewScan(2, 1_001).status).toBe('in_flight');

  finishFirstScan();
  if (first.status === 'started') await first.promise;
  expect(scanFolder).toHaveBeenCalledTimes(1);
  expect(onViewScan.startOnViewScan(2, 1_002).status).toBe('cooldown');

  const afterCooldown = onViewScan.startOnViewScan(
    2,
    1_000 + onViewScan.ON_VIEW_SCAN_COOLDOWN_MS,
  );
  expect(afterCooldown.status).toBe('started');
  if (afterCooldown.status === 'started') await afterCooldown.promise;
  expect(scanFolder).toHaveBeenCalledTimes(2);
});

test('on-view request drain coalesces duplicate folder views after response', async () => {
  const { onViewScan, scanFolder } = await loadOnViewScan('direct');
  const request = {} as IncomingMessage;

  const folderIds = onViewScan.createOnViewScanSet(request);
  folderIds.add(2);
  folderIds.add(2);
  onViewScan.drainOnViewScanRequests(request);

  await vi.waitFor(() => expect(scanFolder).toHaveBeenCalledOnce());
});

test('on-view scan disabled mode does not touch the filesystem', async () => {
  const { onViewScan, scanFolder } = await loadOnViewScan('off');

  const request = {} as IncomingMessage;
  const folderIds = onViewScan.createOnViewScanSet(request);
  folderIds.add(2);
  onViewScan.drainOnViewScanRequests(request);

  expect(scanFolder).not.toHaveBeenCalled();
});

test('a second-pass failure is logged and clears the in-flight state', async () => {
  let pass = 0;
  const { log, onViewScan, scanFolder } = await loadOnViewScan(
    'direct',
    async () => {
      pass++;
      if (pass === 1) return scanResult({ unsettledFolders: 1 });
      if (pass === 2) throw new Error('NAS asleep');
      return scanResult();
    },
  );

  onViewScan.enqueueOnViewScan(2);
  await vi.waitFor(() =>
    expect(log).toHaveBeenCalledWith(
      'error',
      'On-view scan failed for folder 2: NAS asleep',
    ),
  );

  const retry = onViewScan.startOnViewScan(2, Number.MAX_SAFE_INTEGER);
  expect(retry.status).toBe('started');
  if (retry.status === 'started') await retry.promise;
  expect(scanFolder).toHaveBeenCalledTimes(3);
});

test('folder resolver can mark a viewed folder without requiring a request set', async () => {
  const { onViewScan } = await loadOnViewScan();
  const scanFolderIds = new Set<number>();

  onViewScan.markFolderViewedForScan({ scanFolderIds }, 3);
  onViewScan.markFolderViewedForScan({}, 4);

  expect([...scanFolderIds]).toEqual([3]);
});
