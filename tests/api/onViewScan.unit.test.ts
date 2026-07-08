import type { IncomingMessage } from 'node:http';
import { afterEach, expect, test, vi } from 'vitest';
import type { OnViewScanMode } from '../../backend/config/IPicrConfiguration';

const loadOnViewScan = async (
  onViewScanMode: OnViewScanMode = 'direct',
  scanFolderImpl: () => Promise<unknown> = async () => ({}),
) => {
  vi.resetModules();

  const scanFolder = vi.fn(scanFolderImpl);
  const log = vi.fn();
  const picrConfig = { onViewScanMode };

  vi.doMock('../../backend/filesystem/scanFolder.js', () => ({
    scanFolder,
  }));
  vi.doMock('../../backend/config/picrConfig.js', () => ({
    picrConfig,
  }));
  vi.doMock('../../backend/logger.js', () => ({
    log,
  }));

  const onViewScan = await import('../../backend/filesystem/onViewScan.js');
  onViewScan.resetOnViewScanStateForTests();
  return { log, onViewScan, scanFolder };
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
    generateThumbs: true,
    scanExistingFolders: false,
  });
  expect(onViewScan.onViewScanOptions(2, 'direct_and_new')).toEqual({
    depth: 1,
    generateThumbs: true,
    scanExistingFolders: false,
  });
  expect(onViewScan.onViewScanOptions(2, 'one_level')).toEqual({
    depth: 1,
    generateThumbs: true,
    scanExistingFolders: true,
  });
  expect(onViewScan.onViewScanOptions(1, 'one_level')).toEqual({
    depth: 0,
    generateThumbs: true,
    scanExistingFolders: false,
  });
});

test('on-view scan starts only once per in-flight scan and cooldown window', async () => {
  const { onViewScan, scanFolder } = await loadOnViewScan('direct');

  const first = onViewScan.startOnViewScan(2, 1000);
  expect(first.status).toBe('started');
  expect(scanFolder).toHaveBeenCalledTimes(1);

  expect(onViewScan.startOnViewScan(2, 1001).status).toBe('in_flight');
  if (first.status === 'started') await first.promise;

  expect(onViewScan.startOnViewScan(2, 1002).status).toBe('cooldown');

  const afterCooldown = onViewScan.startOnViewScan(
    2,
    1000 + onViewScan.ON_VIEW_SCAN_COOLDOWN_MS,
  );
  expect(afterCooldown.status).toBe('started');
  expect(scanFolder).toHaveBeenCalledTimes(2);
});

test('on-view request drain coalesces duplicate folder views after response', async () => {
  const { onViewScan, scanFolder } = await loadOnViewScan('direct');
  const request = {} as IncomingMessage;

  const folderIds = onViewScan.createOnViewScanSet(request);
  folderIds.add(2);
  folderIds.add(2);
  onViewScan.drainOnViewScanRequests(request);

  expect(scanFolder).toHaveBeenCalledTimes(1);
  expect(scanFolder).toHaveBeenCalledWith(2, {
    depth: 0,
    generateThumbs: true,
    scanExistingFolders: false,
  });
});

test('on-view scan disabled mode does not touch the filesystem', async () => {
  const { onViewScan, scanFolder } = await loadOnViewScan('off');

  const request = {} as IncomingMessage;
  const folderIds = onViewScan.createOnViewScanSet(request);
  folderIds.add(2);
  onViewScan.drainOnViewScanRequests(request);

  expect(scanFolder).not.toHaveBeenCalled();
});

test('on-view scan catches background scan failures', async () => {
  const { log, onViewScan } = await loadOnViewScan('direct', async () => {
    throw new Error('NAS asleep');
  });

  onViewScan.enqueueOnViewScan(2);
  await Promise.resolve();
  await Promise.resolve();

  expect(log).toHaveBeenCalledWith(
    'error',
    'On-view scan failed for folder 2: NAS asleep',
  );
});

test('folder resolver can mark a viewed folder without requiring a request set', async () => {
  const { onViewScan } = await loadOnViewScan();
  const scanFolderIds = new Set<number>();

  onViewScan.markFolderViewedForScan({ scanFolderIds }, 3);
  onViewScan.markFolderViewedForScan({}, 4);

  expect([...scanFolderIds]).toEqual([3]);
});
