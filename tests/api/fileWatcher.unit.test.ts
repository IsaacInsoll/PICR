import { afterEach, expect, test, vi } from 'vitest';
import type { IPicrConfiguration } from '../../backend/config/IPicrConfiguration';

const mediaPath = '/media';

const configForMode = (
  fileWatcherMode: IPicrConfiguration['fileWatcherMode'],
): IPicrConfiguration =>
  ({
    fileWatcherMode,
    mediaPath,
    pollingInterval: 20,
  }) as IPicrConfiguration;

const loadFileWatcher = async (scanFolderTreeError?: Error) => {
  vi.resetModules();

  const scanFolderTree = vi.fn(async () => {
    if (scanFolderTreeError) throw scanFolderTreeError;
    return {
      addedFiles: 0,
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
    };
  });
  const markInitComplete = vi.fn();
  const addToQueue = vi.fn();
  const log = vi.fn();
  const handlers = new Map<string, (...args: unknown[]) => void>();
  const watcher = {
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      handlers.set(event, handler);
      return watcher;
    }),
  };
  const watch = vi.fn(() => watcher);
  const where = vi.fn();
  const set = vi.fn(() => ({ where }));
  const update = vi.fn(() => ({ set }));

  vi.doMock('drizzle-orm', () => ({
    isNotNull: vi.fn(() => 'is-not-null'),
  }));
  vi.doMock('../../backend/filesystem/scanFolder.js', () => ({
    scanFolderTree,
  }));
  vi.doMock('../../backend/filesystem/fileQueue.js', () => ({
    addToQueue,
    initComplete: false,
    markInitComplete,
  }));
  vi.doMock('../../backend/filesystem/renameTracker.js', () => ({
    createRenameTracker: vi.fn(() => ({
      consumeRename: vi.fn(),
      markUnlink: vi.fn(),
      record: vi.fn(),
    })),
  }));
  vi.doMock('../../backend/filesystem/fileManager.js', () => ({
    relativePath: (path: string) => path.replace(mediaPath, ''),
  }));
  vi.doMock('../../backend/filesystem/ignoredPaths.js', () => ({
    ignoredPathPattern: /ignored/,
  }));
  vi.doMock('../../backend/config/picrConfig.js', () => ({
    picrConfig: { mediaPath },
  }));
  vi.doMock('../../backend/logger.js', () => ({ log }));
  vi.doMock('../../backend/db/picrDb.js', () => ({
    db: { update },
  }));
  vi.doMock('../../backend/db/models/index.js', () => ({
    dbFile: {},
    dbFolder: { parentId: 'parentId' },
  }));

  const { fileWatcher } =
    await import('../../backend/filesystem/fileWatcher.js');
  return {
    addToQueue,
    fileWatcher,
    handlers,
    log,
    markInitComplete,
    scanFolderTree,
    update,
    watch,
  };
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

test('FILE_WATCHER=off runs the boot scan and does not start chokidar', async () => {
  const { fileWatcher, markInitComplete, scanFolderTree, update, watch } =
    await loadFileWatcher();

  await fileWatcher(configForMode('off'), 42);

  expect(scanFolderTree).toHaveBeenCalledWith(42, { generateThumbs: false });
  expect(markInitComplete).toHaveBeenCalledOnce();
  expect(watch).not.toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();
});

test('FILE_WATCHER=off serves existing data if the boot scan fails', async () => {
  const { fileWatcher, log, markInitComplete, scanFolderTree, watch } =
    await loadFileWatcher(new Error('NAS not ready'));

  await expect(fileWatcher(configForMode('off'), 42)).resolves.toBeUndefined();

  expect(scanFolderTree).toHaveBeenCalledWith(42, { generateThumbs: false });
  expect(markInitComplete).toHaveBeenCalledOnce();
  expect(watch).not.toHaveBeenCalled();
  expect(log).toHaveBeenCalledWith(
    'error',
    'Boot scan failed; serving existing data: NAS not ready',
    true,
  );
});

test('FILE_WATCHER=polling keeps chokidar initial emit as the boot scan', async () => {
  const { addToQueue, fileWatcher, handlers, scanFolderTree, update, watch } =
    await loadFileWatcher();

  await fileWatcher(configForMode('polling'), 42, watch);

  expect(scanFolderTree).not.toHaveBeenCalled();
  expect(update).toHaveBeenCalledTimes(2);
  expect(watch).toHaveBeenCalledWith(
    mediaPath,
    expect.objectContaining({
      alwaysStat: true,
      awaitWriteFinish: true,
      binaryInterval: 6000,
      interval: 2000,
      persistent: true,
      usePolling: true,
    }),
  );

  handlers.get('ready')?.();
  expect(addToQueue).toHaveBeenCalledWith('initComplete', {});
});
