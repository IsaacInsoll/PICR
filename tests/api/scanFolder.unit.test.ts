import {
  link,
  mkdtemp,
  mkdir,
  rm,
  stat,
  symlink,
  utimes,
  writeFile,
} from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, expect, test, vi } from 'vitest';
import { contentHashForStats } from '../../backend/filesystem/fileHash';

interface MockFileRow {
  id?: number;
  name: string;
  relativePath: string;
  fileHash: string | null;
  folderId?: number;
  stIno?: bigint | null;
}

interface MockFolderRow {
  id: number;
  name: string;
  relativePath: string | null;
  parentId?: number | null;
  stIno?: bigint | null;
}

const mediaRoots: string[] = [];

const createMediaRoot = async () => {
  const mediaRoot = await mkdtemp(join(tmpdir(), 'picr-scan-folder-'));
  mediaRoots.push(mediaRoot);
  return mediaRoot;
};

const makeOld = async (path: string) => {
  const old = new Date(Date.now() - 15_000);
  await utimes(path, old, old);
};

const setMtime = async (path: string, when: Date) => {
  await utimes(path, when, when);
};

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
};

const waitFor = async (predicate: () => boolean) => {
  for (let i = 0; i < 50; i++) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error('Timed out waiting for condition');
};

const loadScanFolder = async ({
  mediaRoot,
  files = [],
  folders = [],
  folderRelativePath = '',
  beforeAddFileCommit,
}: {
  mediaRoot: string;
  files?: MockFileRow[];
  folders?: MockFolderRow[];
  folderRelativePath?: string;
  beforeAddFileCommit?: () => Promise<void>;
}) => {
  vi.resetModules();
  const { dbFile, dbFolder } = await import('../../backend/db/models/index.js');

  const folderRows: MockFolderRow[] = [
    {
      id: 10,
      name: 'Home',
      relativePath: folderRelativePath,
      parentId: null,
    },
    ...folders.map((folder) => ({
      ...folder,
      parentId: folder.parentId ?? 10,
    })),
  ];
  files.forEach((file, index) => {
    file.id ??= index + 1;
  });
  currentFolderId = 10;
  let nextFolderId = Math.max(...folderRows.map((folder) => folder.id)) + 1;
  let nextFileId = Math.max(0, ...files.map((file) => file.id ?? 0)) + 1;

  const addFile = vi.fn(
    async (
      path: string,
      _generateThumbs: boolean,
      stats: Parameters<typeof contentHashForStats>[0],
      renameFromPath?: string,
      stIno?: bigint | null,
    ) => {
      const relativeFolderPath = relativePathFor(mediaRoot, dirname(path));
      const folder = folderRows.find(
        (folderRow) => folderRow.relativePath === relativeFolderPath,
      );
      const updateFile = (file: MockFileRow) => {
        file.name = basename(path);
        file.relativePath = relativeFolderPath;
        file.folderId = folder?.id ?? 10;
        file.fileHash = contentHashForStats(stats);
        if (stIno) file.stIno = stIno;
      };

      if (renameFromPath) {
        const oldRelativeFolderPath = relativePathFor(
          mediaRoot,
          dirname(renameFromPath),
        );
        const existing = files.find(
          (file) =>
            file.name === basename(renameFromPath) &&
            file.relativePath === oldRelativeFolderPath,
        );
        if (existing) {
          updateFile(existing);
          return;
        }
      }

      const existing = files.find(
        (file) =>
          file.name === basename(path) &&
          file.relativePath === relativeFolderPath,
      );
      if (existing) {
        updateFile(existing);
        return;
      }

      await beforeAddFileCommit?.();
      files.push({
        id: nextFileId++,
        name: basename(path),
        relativePath: relativeFolderPath,
        folderId: folder?.id ?? 10,
        fileHash: contentHashForStats(stats),
        stIno: stIno ?? null,
      });
    },
  );
  const addFolder = vi.fn(async (path: string) => {
    const relativePath = relativePathFor(mediaRoot, path);
    const parentRelativePath = relativePathFor(mediaRoot, dirname(path));
    const parent = folderRows.find(
      (folder) => folder.relativePath === parentRelativePath,
    );
    const id = nextFolderId++;
    folderRows.push({
      id,
      name: basename(path),
      relativePath,
      parentId: parent?.id ?? null,
    });
    return id;
  });
  const removeFile = vi.fn();
  const removeFolder = vi.fn();
  const renameFolder = vi.fn();
  const log = vi.fn();
  const update = vi.fn((table) => ({
    set: vi.fn((values: Record<string, unknown>) => ({
      where: vi.fn(async () => {
        if (table === dbFile || table === dbFolder) void values;
      }),
    })),
  }));

  vi.doMock('../../backend/filesystem/events/addFile.js', () => ({ addFile }));
  vi.doMock('../../backend/filesystem/events/addFolder.js', () => ({
    addFolder,
  }));
  vi.doMock('../../backend/filesystem/events/removeFile.js', () => ({
    removeFile,
  }));
  vi.doMock('../../backend/filesystem/events/removeFolder.js', () => ({
    removeFolder,
  }));
  vi.doMock('../../backend/filesystem/events/renameFolder.js', () => ({
    renameFolder,
  }));
  vi.doMock('../../backend/logger.js', () => ({ log }));
  vi.doMock('../../backend/db/picrDb.js', () => ({
    dbFolderForId: vi.fn(async (id: number) => {
      currentFolderId = id;
      return folderRows.find((folder) => folder.id === id);
    }),
    db: {
      select: vi.fn(() => ({
        from: vi.fn((table) => ({
          where: vi.fn(async () => {
            if (table === dbFile)
              return files.filter((file) => file.stIno != null);
            if (table === dbFolder)
              return folderRows.filter(
                (folder) => folder.stIno != null && folder.parentId != null,
              );
            return [];
          }),
        })),
      })),
      update,
      query: {
        dbFile: {
          findMany: vi.fn(async () =>
            files.filter((file) => (file.folderId ?? 10) === currentFolderId),
          ),
        },
        dbFolder: {
          findMany: vi.fn(async () =>
            folderRows.filter((folder) => folder.parentId === currentFolderId),
          ),
        },
      },
    },
  }));

  const { picrConfig } = await import('../../backend/config/picrConfig.js');
  picrConfig.mediaPath = mediaRoot;

  const { scanFolder, scanFolderTree } =
    await import('../../backend/filesystem/scanFolder.js');
  const mediaScanActivity =
    await import('../../backend/filesystem/mediaScanActivity.js');

  return {
    addFile,
    addFolder,
    files,
    log,
    mediaScanActivity,
    removeFile,
    removeFolder,
    renameFolder,
    scanFolder,
    scanFolderTree,
    update,
  };
};

const relativePathFor = (mediaRoot: string, path: string) =>
  path.replace(mediaRoot, '').replace(/^\//, '');

let currentFolderId = 10;

afterEach(async () => {
  vi.restoreAllMocks();
  vi.resetModules();
  await Promise.all(
    mediaRoots
      .splice(0)
      .map((mediaRoot) => rm(mediaRoot, { recursive: true, force: true })),
  );
});

test('adds new direct files and folders while sharing watcher ignore rules', async () => {
  const mediaRoot = await createMediaRoot();
  const newFilePath = join(mediaRoot, 'new.jpg');
  await writeFile(newFilePath, 'image');
  await makeOld(newFilePath);
  await mkdir(join(mediaRoot, 'New Folder'));
  await writeFile(join(mediaRoot, '.hidden.jpg'), 'hidden');
  await mkdir(join(mediaRoot, '@eaDir'));
  await writeFile(join(mediaRoot, 'Thumbs.db'), 'thumb cache');

  const { addFile, addFolder, log, scanFolder } = await loadScanFolder({
    mediaRoot,
  });

  const result = await scanFolder(10);

  expect(addFile).toHaveBeenCalledOnce();
  expect(addFile).toHaveBeenCalledWith(
    join(mediaRoot, 'new.jpg'),
    false,
    expect.any(Object),
    undefined,
    expect.anything(),
  );
  expect(addFolder).toHaveBeenCalledOnce();
  expect(addFolder).toHaveBeenCalledWith(
    join(mediaRoot, 'New Folder'),
    expect.any(Object),
    expect.anything(),
  );
  expect(result).toMatchObject({
    addedFiles: 1,
    addedFolders: 1,
    ignored: 3,
  });
  expect(log).toHaveBeenCalledWith(
    'debug',
    expect.stringContaining('scanFolder(10)'),
  );
});

test('serializes concurrent scans of the same folder before reading db rows', async () => {
  const mediaRoot = await createMediaRoot();
  const newFilePath = join(mediaRoot, 'new.jpg');
  await writeFile(newFilePath, 'image');
  await makeOld(newFilePath);
  const insertGate = deferred();
  let pauseNextInsert = true;

  const { addFile, files, scanFolder } = await loadScanFolder({
    mediaRoot,
    beforeAddFileCommit: async () => {
      if (!pauseNextInsert) return;
      pauseNextInsert = false;
      await insertGate.promise;
    },
  });

  const firstScan = scanFolder(10);
  await waitFor(() => addFile.mock.calls.length === 1);
  const secondScan = scanFolder(10);
  await Promise.resolve();

  expect(addFile).toHaveBeenCalledOnce();

  insertGate.resolve();
  await Promise.all([firstScan, secondScan]);

  expect(addFile).toHaveBeenCalledOnce();
  expect(files).toHaveLength(1);
});

test('skips recursive folder cycles instead of deadlocking', async () => {
  const mediaRoot = await createMediaRoot();
  await mkdir(join(mediaRoot, 'child'));
  await mkdir(join(mediaRoot, 'child', 'Home'));

  const { addFile, log, scanFolder } = await loadScanFolder({
    mediaRoot,
    folders: [
      {
        id: 11,
        name: 'child',
        relativePath: 'child',
        parentId: 10,
      },
      {
        id: 10,
        name: 'Home',
        relativePath: '',
        parentId: 11,
      },
    ],
  });

  const result = await scanFolder(10, { depth: 3, scanExistingFolders: true });

  expect(result.addedFiles).toBe(0);
  expect(addFile).not.toHaveBeenCalled();
  expect(log).toHaveBeenCalledWith(
    'warn',
    'Skipping recursive scan cycle at folder 10',
    true,
  );
});

test('removes missing database rows scoped to the scanned folder', async () => {
  const mediaRoot = await createMediaRoot();
  await writeFile(join(mediaRoot, 'kept.jpg'), 'same');
  await mkdir(join(mediaRoot, 'Kept Folder'));
  const keptStats = await stat(join(mediaRoot, 'kept.jpg'));

  const { addFile, removeFile, removeFolder, scanFolder } =
    await loadScanFolder({
      mediaRoot,
      files: [
        {
          name: 'kept.jpg',
          relativePath: '',
          fileHash: contentHashForStats(keptStats),
        },
        {
          name: 'gone.jpg',
          relativePath: '',
          fileHash: 'missing',
        },
      ],
      folders: [
        { id: 20, name: 'Kept Folder', relativePath: 'Kept Folder' },
        { id: 21, name: 'Gone Folder', relativePath: 'Gone Folder' },
      ],
    });

  const result = await scanFolder(10);

  expect(removeFile).toHaveBeenCalledOnce();
  expect(removeFile).toHaveBeenCalledWith(join(mediaRoot, 'gone.jpg'));
  expect(removeFolder).toHaveBeenCalledOnce();
  expect(removeFolder).toHaveBeenCalledWith(join(mediaRoot, 'Gone Folder'));
  // The unchanged file (matching content signature) must be left alone.
  expect(addFile).not.toHaveBeenCalled();
  expect(result).toMatchObject({
    removedFiles: 1,
    removedFolders: 1,
  });
});

test('re-adds an existing file when its content signature changed', async () => {
  const mediaRoot = await createMediaRoot();
  const changedFilePath = join(mediaRoot, 'changed.jpg');
  await writeFile(changedFilePath, 'new content');
  await makeOld(changedFilePath);

  const { addFile, scanFolder } = await loadScanFolder({
    mediaRoot,
    files: [
      {
        name: 'changed.jpg',
        relativePath: '',
        fileHash: 'old-signature',
      },
    ],
  });

  const result = await scanFolder(10, { generateThumbs: true });

  expect(addFile).toHaveBeenCalledOnce();
  expect(addFile).toHaveBeenCalledWith(
    join(mediaRoot, 'changed.jpg'),
    true,
    expect.any(Object),
    undefined,
    expect.anything(),
  );
  expect(result).toMatchObject({
    changedFiles: 1,
  });
});

test('moves a file into the scanned folder by a single inode candidate', async () => {
  const mediaRoot = await createMediaRoot();
  const movedFilePath = join(mediaRoot, 'moved.jpg');
  await writeFile(movedFilePath, 'moved content');
  await makeOld(movedFilePath);
  const movedStats = await stat(movedFilePath);

  const { addFile, scanFolder } = await loadScanFolder({
    mediaRoot,
    files: [
      {
        id: 99,
        name: 'old.jpg',
        relativePath: 'Source',
        folderId: 42,
        fileHash: contentHashForStats(movedStats),
        stIno: BigInt(movedStats.ino),
      },
    ],
  });

  const result = await scanFolder(10);

  expect(addFile).toHaveBeenCalledOnce();
  expect(addFile).toHaveBeenCalledWith(
    movedFilePath,
    false,
    expect.any(Object),
    join(mediaRoot, 'Source', 'old.jpg'),
    BigInt(movedStats.ino),
  );
  expect(result).toMatchObject({
    addedFiles: 0,
    movedFiles: 1,
    removedFiles: 0,
  });
});

test('moves a renamed file within the scanned folder by a single content-hash candidate', async () => {
  const mediaRoot = await createMediaRoot();
  const newFilePath = join(mediaRoot, 'new-name.jpg');
  await writeFile(newFilePath, 'same content');
  await makeOld(newFilePath);
  const newStats = await stat(newFilePath);

  const { addFile, scanFolder } = await loadScanFolder({
    mediaRoot,
    files: [
      {
        id: 7,
        name: 'old-name.jpg',
        relativePath: '',
        folderId: 10,
        fileHash: contentHashForStats(newStats),
      },
    ],
  });

  const result = await scanFolder(10);

  expect(addFile).toHaveBeenCalledOnce();
  expect(addFile).toHaveBeenCalledWith(
    newFilePath,
    false,
    expect.any(Object),
    join(mediaRoot, 'old-name.jpg'),
    expect.anything(),
  );
  expect(result).toMatchObject({
    movedFiles: 1,
    removedFiles: 0,
  });
});

test('does not treat an existing path with a changed inode as a move', async () => {
  const mediaRoot = await createMediaRoot();
  const samePath = join(mediaRoot, 'same.jpg');
  await writeFile(samePath, 'same content');
  await makeOld(samePath);
  const sameStats = await stat(samePath);

  const { addFile, removeFile, scanFolder, update } = await loadScanFolder({
    mediaRoot,
    files: [
      {
        id: 1,
        name: 'same.jpg',
        relativePath: '',
        folderId: 10,
        fileHash: contentHashForStats(sameStats),
        stIno: 123n,
      },
    ],
  });

  const result = await scanFolder(10);

  expect(addFile).not.toHaveBeenCalled();
  expect(removeFile).not.toHaveBeenCalled();
  expect(update).toHaveBeenCalled();
  expect(result).toMatchObject({
    movedFiles: 0,
    removedFiles: 0,
  });
});

test('logs an ambiguous inode file match and falls back to adding the file', async () => {
  const mediaRoot = await createMediaRoot();
  const newFilePath = join(mediaRoot, 'new.jpg');
  await writeFile(newFilePath, 'new content');
  await makeOld(newFilePath);
  const newStats = await stat(newFilePath);
  const stIno = BigInt(newStats.ino);

  const { addFile, log, scanFolder } = await loadScanFolder({
    mediaRoot,
    files: [
      {
        id: 1,
        name: 'first.jpg',
        relativePath: 'A',
        folderId: 20,
        fileHash: 'first',
        stIno,
      },
      {
        id: 2,
        name: 'second.jpg',
        relativePath: 'B',
        folderId: 21,
        fileHash: 'second',
        stIno,
      },
    ],
  });

  const result = await scanFolder(10);

  expect(log).toHaveBeenCalledWith(
    'warn',
    expect.stringContaining('Ambiguous scan file move by inode'),
  );
  expect(addFile).toHaveBeenCalledOnce();
  expect(result).toMatchObject({
    addedFiles: 1,
    movedFiles: 0,
  });
});

test('adds a hardlinked new file instead of moving the existing row', async () => {
  const mediaRoot = await createMediaRoot();
  const existingPath = join(mediaRoot, 'existing.jpg');
  const linkedPath = join(mediaRoot, 'linked.jpg');
  await writeFile(existingPath, 'same inode');
  await link(existingPath, linkedPath);
  await makeOld(existingPath);
  const existingStats = await stat(existingPath);

  const { addFile, removeFile, scanFolder } = await loadScanFolder({
    mediaRoot,
    files: [
      {
        id: 1,
        name: 'existing.jpg',
        relativePath: '',
        folderId: 10,
        fileHash: contentHashForStats(existingStats),
        stIno: BigInt(existingStats.ino),
      },
    ],
  });

  const result = await scanFolder(10);

  expect(removeFile).not.toHaveBeenCalled();
  expect(addFile).toHaveBeenCalledOnce();
  expect(addFile).toHaveBeenCalledWith(
    linkedPath,
    false,
    expect.any(Object),
    undefined,
    BigInt(existingStats.ino),
  );
  expect(result).toMatchObject({
    addedFiles: 1,
    movedFiles: 0,
    removedFiles: 0,
  });
});

test('moves a folder into the scanned folder by a single inode candidate', async () => {
  const mediaRoot = await createMediaRoot();
  const movedFolderPath = join(mediaRoot, 'Moved Folder');
  await mkdir(movedFolderPath);
  const movedStats = await stat(movedFolderPath);

  const { addFolder, renameFolder, scanFolder } = await loadScanFolder({
    mediaRoot,
    folders: [
      {
        id: 30,
        name: 'Old Folder',
        relativePath: 'Source/Old Folder',
        parentId: 42,
        stIno: BigInt(movedStats.ino),
      },
    ],
  });

  const result = await scanFolder(10);

  expect(addFolder).not.toHaveBeenCalled();
  expect(renameFolder).toHaveBeenCalledOnce();
  expect(renameFolder).toHaveBeenCalledWith(
    join(mediaRoot, 'Source', 'Old Folder'),
    movedFolderPath,
    expect.any(Object),
    BigInt(movedStats.ino),
  );
  expect(result).toMatchObject({
    addedFolders: 0,
    movedFolders: 1,
  });
});

test('scanFolderTree descends into existing folders and retries unsettled large files', async () => {
  const mediaRoot = await createMediaRoot();
  const existingFolderPath = join(mediaRoot, 'Existing Folder');
  const largeFilePath = join(existingFolderPath, 'large.mov');
  await mkdir(existingFolderPath);
  await writeFile(largeFilePath, Buffer.alloc(5 * 1024 * 1024 + 1));
  await makeOld(largeFilePath);

  const { addFile, scanFolderTree } = await loadScanFolder({
    mediaRoot,
    folders: [
      {
        id: 20,
        name: 'Existing Folder',
        relativePath: 'Existing Folder',
      },
    ],
  });

  const result = await scanFolderTree(10, { settleDelayMs: 0 });

  expect(addFile).toHaveBeenCalledOnce();
  expect(addFile).toHaveBeenCalledWith(
    largeFilePath,
    false,
    expect.any(Object),
    undefined,
    expect.anything(),
  );
  expect(result).toMatchObject({
    addedFiles: 1,
    completed: true,
    cleanupRun: true,
    scanPasses: 2,
    unsettledFiles: 0,
  });
});

test('direct low-level scanFolder work does not create media scan activity', async () => {
  const mediaRoot = await createMediaRoot();
  const filePath = join(mediaRoot, 'new.jpg');
  await writeFile(filePath, 'image');
  await makeOld(filePath);
  const addFileCommit = deferred();
  const { addFile, mediaScanActivity, scanFolder } = await loadScanFolder({
    mediaRoot,
    beforeAddFileCommit: async () => addFileCommit.promise,
  });
  let now = 0;
  mediaScanActivity.resetMediaScanActivityForTests(() => now);

  const running = scanFolder(10);
  await waitFor(() => addFile.mock.calls.length === 1);
  now = 1_500;
  expect(mediaScanActivity.mediaScanTaskStatus()).toBeNull();

  addFileCommit.resolve();
  await running;
});

test('scanFolderTree activity spans its settle delay and cleanup pass', async () => {
  const mediaRoot = await createMediaRoot();
  const largeFilePath = join(mediaRoot, 'large.mov');
  await writeFile(largeFilePath, Buffer.alloc(5 * 1024 * 1024 + 1));
  await makeOld(largeFilePath);
  const settle = deferred();
  const settleDelay = vi.fn(async () => settle.promise);
  const { mediaScanActivity, scanFolderTree } = await loadScanFolder({
    mediaRoot,
  });
  let now = 0;
  mediaScanActivity.resetMediaScanActivityForTests(() => now);

  const running = scanFolderTree(10, { settleDelay });
  await waitFor(() => settleDelay.mock.calls.length === 1);
  now = 1_500;
  expect(mediaScanActivity.mediaScanTaskStatus()?.id).toBe('media-scan');

  settle.resolve();
  await expect(running).resolves.toMatchObject({
    cleanupRun: true,
    completed: true,
    scanPasses: 2,
  });
  expect(mediaScanActivity.mediaScanTaskStatus()).toBeNull();
});

test('scanFolderTree moves files before cleanup removes missing rows', async () => {
  const mediaRoot = await createMediaRoot();
  const sourceFolderPath = join(mediaRoot, 'Source');
  const destFolderPath = join(mediaRoot, 'Dest');
  const movedFilePath = join(destFolderPath, 'moved.jpg');
  await mkdir(sourceFolderPath);
  await mkdir(destFolderPath);
  await writeFile(movedFilePath, 'moved content');
  await makeOld(movedFilePath);
  const movedStats = await stat(movedFilePath);

  const { addFile, removeFile, scanFolderTree } = await loadScanFolder({
    mediaRoot,
    folders: [
      { id: 20, name: 'Source', relativePath: 'Source' },
      { id: 21, name: 'Dest', relativePath: 'Dest' },
    ],
    files: [
      {
        id: 30,
        name: 'old.jpg',
        relativePath: 'Source',
        folderId: 20,
        fileHash: contentHashForStats(movedStats),
        stIno: BigInt(movedStats.ino),
      },
    ],
  });

  const result = await scanFolderTree(10, { settleDelayMs: 0 });

  expect(addFile).toHaveBeenCalledWith(
    movedFilePath,
    false,
    expect.any(Object),
    join(mediaRoot, 'Source', 'old.jpg'),
    BigInt(movedStats.ino),
  );
  expect(removeFile).not.toHaveBeenCalled();
  expect(result).toMatchObject({
    movedFiles: 1,
    removedFiles: 0,
    completed: true,
    cleanupRun: true,
  });
});

test('waits for a fresh file to be stable across two scans before adding it', async () => {
  const mediaRoot = await createMediaRoot();
  await writeFile(join(mediaRoot, 'fresh.jpg'), 'still copying');

  const { addFile, scanFolder } = await loadScanFolder({
    mediaRoot,
  });

  const firstResult = await scanFolder(10);

  expect(addFile).not.toHaveBeenCalled();
  expect(firstResult).toMatchObject({
    addedFiles: 0,
    unsettledFiles: 1,
  });

  const secondResult = await scanFolder(10);

  expect(addFile).toHaveBeenCalledOnce();
  expect(addFile).toHaveBeenCalledWith(
    join(mediaRoot, 'fresh.jpg'),
    false,
    expect.any(Object),
    undefined,
    expect.anything(),
  );
  expect(secondResult).toMatchObject({
    addedFiles: 1,
    unsettledFiles: 0,
  });
});

test('large files require stability even when their mtime is old enough for the small-file fast path', async () => {
  const mediaRoot = await createMediaRoot();
  const largeFilePath = join(mediaRoot, 'large.mov');
  await writeFile(largeFilePath, Buffer.alloc(5 * 1024 * 1024 + 1));
  await makeOld(largeFilePath);

  const { addFile, scanFolder } = await loadScanFolder({
    mediaRoot,
  });

  const firstResult = await scanFolder(10);

  expect(addFile).not.toHaveBeenCalled();
  expect(firstResult).toMatchObject({
    addedFiles: 0,
    unsettledFiles: 1,
  });

  const secondResult = await scanFolder(10);

  expect(addFile).toHaveBeenCalledOnce();
  expect(secondResult).toMatchObject({
    addedFiles: 1,
    unsettledFiles: 0,
  });
});

test('prunes a vanished growing file so a reappearance is re-confirmed across two scans', async () => {
  const mediaRoot = await createMediaRoot();
  const path = join(mediaRoot, 'large.mov');
  const frozen = new Date('2020-01-01T00:00:00Z');
  const big = Buffer.alloc(5 * 1024 * 1024 + 1);

  await writeFile(path, big);
  await setMtime(path, frozen);

  const { addFile, scanFolder } = await loadScanFolder({ mediaRoot });

  await scanFolder(10); // first sighting -> unsettled, signature recorded
  expect(addFile).not.toHaveBeenCalled();

  await rm(path); // vanishes before settling
  await scanFolder(10); // prune drops the stale signature

  // Reappears with an identical size + mtime to the first sighting. Without the
  // prune the stale signature would settle it on this single sighting; the prune
  // forces a fresh two-scan confirmation.
  await writeFile(path, big);
  await setMtime(path, frozen);

  await scanFolder(10);
  expect(addFile).not.toHaveBeenCalled();

  await scanFolder(10); // second fresh sighting -> settled -> imported
  expect(addFile).toHaveBeenCalledOnce();
});

test('clears a growing signature when the database already matches the disk file', async () => {
  const mediaRoot = await createMediaRoot();
  const path = join(mediaRoot, 'large.mov');
  const frozen = new Date('2020-01-01T00:00:00Z');
  const big = Buffer.alloc(5 * 1024 * 1024 + 1);
  const files: MockFileRow[] = [];

  await writeFile(path, big);
  await setMtime(path, frozen);

  const { addFile, scanFolder } = await loadScanFolder({ mediaRoot, files });

  await scanFolder(10); // first sighting -> unsettled, signature recorded
  expect(addFile).not.toHaveBeenCalled();

  files.push({
    name: 'large.mov',
    relativePath: '',
    fileHash: contentHashForStats(await stat(path)),
  });
  await scanFolder(10); // matching DB row clears the stale growing signature

  await rm(path);
  await writeFile(path, big);
  await setMtime(path, frozen);
  files.splice(0);

  await scanFolder(10);
  expect(addFile).not.toHaveBeenCalled();

  await scanFolder(10);
  expect(addFile).toHaveBeenCalledOnce();
});

test('keeps descending into a new pending folder until its files settle', async () => {
  const mediaRoot = await createMediaRoot();
  const uploadFolderPath = join(mediaRoot, 'Upload');
  const pendingFilePath = join(uploadFolderPath, 'fresh.jpg');
  await mkdir(uploadFolderPath);
  await writeFile(pendingFilePath, 'still copying');

  const { addFile, addFolder, scanFolder } = await loadScanFolder({
    mediaRoot,
  });

  const firstResult = await scanFolder(10, { depth: 1 });

  expect(addFolder).toHaveBeenCalledOnce();
  expect(addFile).not.toHaveBeenCalled();
  expect(firstResult).toMatchObject({
    addedFolders: 1,
    unsettledFiles: 1,
    unsettledFolders: 1,
  });

  const secondResult = await scanFolder(10, { depth: 1 });

  expect(addFile).toHaveBeenCalledOnce();
  expect(addFile).toHaveBeenCalledWith(
    pendingFilePath,
    false,
    expect.any(Object),
    undefined,
    expect.anything(),
  );
  expect(secondResult).toMatchObject({
    addedFiles: 1,
    unsettledFiles: 0,
    unsettledFolders: 0,
  });
});

test('returns an empty result when the folder no longer exists on disk', async () => {
  const mediaRoot = await createMediaRoot();

  const { addFile, addFolder, removeFile, removeFolder, scanFolder } =
    await loadScanFolder({
      mediaRoot,
      folderRelativePath: 'Deleted Folder', // never created under mediaRoot
      files: [
        { name: 'orphan.jpg', relativePath: 'Deleted Folder', fileHash: 'x' },
      ],
    });

  const result = await scanFolder(10);

  expect(addFile).not.toHaveBeenCalled();
  expect(addFolder).not.toHaveBeenCalled();
  // A vanished folder is unlinked by its parent's scan, not this scoped scan, so
  // we must not archive its rows here just because readdir failed.
  expect(removeFile).not.toHaveBeenCalled();
  expect(removeFolder).not.toHaveBeenCalled();
  expect(result).toMatchObject({
    addedFiles: 0,
    changedFiles: 0,
    removedFiles: 0,
    addedFolders: 0,
    removedFolders: 0,
    unavailableFolders: 1,
  });
});

test('does not complete a recursive scan while its root is unavailable', async () => {
  const mediaRoot = await createMediaRoot();
  const { scanFolderTree } = await loadScanFolder({
    mediaRoot,
    folderRelativePath: 'Missing Scan Root',
  });

  const result = await scanFolderTree(10, { settleDelayMs: 0 });

  expect(result).toMatchObject({
    cleanupRun: false,
    completed: false,
    scanPasses: 2,
    unavailableFolders: 2,
  });
});

test('skips an unreadable entry without archiving its row and keeps scanning siblings', async () => {
  const mediaRoot = await createMediaRoot();
  const goodPath = join(mediaRoot, 'good.jpg');
  await writeFile(goodPath, 'image');
  await makeOld(goodPath);
  // A self-referential symlink: stat() follows it and fails with ELOOP — a
  // non-ENOENT filesystem error — deterministically and cross-platform. This
  // simulates an unreadable entry (bad permissions, flaky NAS mount, etc.).
  await symlink('stuck.raw', join(mediaRoot, 'stuck.raw'));

  const { addFile, removeFile, log, scanFolder } = await loadScanFolder({
    mediaRoot,
    files: [
      { name: 'stuck.raw', relativePath: '', folderId: 10, fileHash: 'x' },
    ],
  });

  const result = await scanFolder(10);

  // The readable sibling is still imported despite the bad entry.
  expect(addFile).toHaveBeenCalledOnce();
  expect(addFile).toHaveBeenCalledWith(
    goodPath,
    false,
    expect.any(Object),
    undefined,
    expect.anything(),
  );
  // The unreadable file's DB row must NOT be archived — it is present on disk,
  // we just could not stat it this pass.
  expect(removeFile).not.toHaveBeenCalled();
  expect(log).toHaveBeenCalledWith(
    'warn',
    expect.stringContaining('Skipping unreadable entry'),
  );
  expect(result).toMatchObject({
    addedFiles: 1,
    removedFiles: 0,
    skippedEntries: 1,
  });
});

test('an unreadable entry does not block recursive cleanup of unrelated missing files', async () => {
  const mediaRoot = await createMediaRoot();
  await symlink('stuck.raw', join(mediaRoot, 'stuck.raw'));

  const { removeFile, scanFolderTree } = await loadScanFolder({
    mediaRoot,
    files: [
      { name: 'stuck.raw', relativePath: '', folderId: 10, fileHash: 'x' },
      { name: 'gone.jpg', relativePath: '', folderId: 10, fileHash: 'y' },
    ],
  });

  const result = await scanFolderTree(10, { settleDelayMs: 0 });

  expect(result).toMatchObject({
    cleanupRun: true,
    completed: true,
    removedFiles: 1,
    scanPasses: 1,
    skippedEntries: 2,
  });
  expect(removeFile).toHaveBeenCalledOnce();
  expect(removeFile).toHaveBeenCalledWith(join(mediaRoot, 'gone.jpg'));
});

test('does not treat an unreadable entry as a move source for a new same-hash file', async () => {
  const mediaRoot = await createMediaRoot();
  const goodPath = join(mediaRoot, 'good.jpg');
  await writeFile(goodPath, 'image');
  await makeOld(goodPath);
  await symlink('stuck.raw', join(mediaRoot, 'stuck.raw'));
  // The DB row for the unreadable file happens to share the new file's content
  // hash. It must NOT be re-homed onto good.jpg, because stuck.raw is still on disk.
  const sharedHash = contentHashForStats(await stat(goodPath));

  const { addFile, removeFile, scanFolder } = await loadScanFolder({
    mediaRoot,
    files: [
      {
        name: 'stuck.raw',
        relativePath: '',
        folderId: 10,
        fileHash: sharedHash,
      },
    ],
  });

  const result = await scanFolder(10);

  // good.jpg is imported as a NEW file (renameFromPath undefined), not a move.
  expect(addFile).toHaveBeenCalledOnce();
  expect(addFile).toHaveBeenCalledWith(
    goodPath,
    false,
    expect.any(Object),
    undefined,
    expect.anything(),
  );
  expect(removeFile).not.toHaveBeenCalled();
  expect(result).toMatchObject({
    addedFiles: 1,
    movedFiles: 0,
    skippedEntries: 1,
  });
});

test('does not abort the scan when an inode move candidate has an unreadable old path', async () => {
  const mediaRoot = await createMediaRoot();
  const newPath = join(mediaRoot, 'new.jpg');
  await writeFile(newPath, 'image');
  await makeOld(newPath);
  // A DB file in another folder matches the new file's inode (per the coarse mock),
  // but its old path is an unreadable symlink loop. Checking "is the old path gone?"
  // must not throw and abort the whole scan.
  await mkdir(join(mediaRoot, 'sub'));
  await symlink('old.raw', join(mediaRoot, 'sub', 'old.raw'));

  const { addFile, removeFile, scanFolder } = await loadScanFolder({
    mediaRoot,
    folders: [{ id: 11, name: 'sub', relativePath: 'sub', parentId: 10 }],
    files: [
      {
        name: 'old.raw',
        relativePath: 'sub',
        folderId: 11,
        fileHash: 'x',
        stIno: 987654321n,
      },
    ],
  });

  const result = await scanFolder(10);

  expect(addFile).toHaveBeenCalledWith(
    newPath,
    false,
    expect.any(Object),
    undefined,
    expect.anything(),
  );
  expect(removeFile).not.toHaveBeenCalled();
  expect(result).toMatchObject({ addedFiles: 1, movedFiles: 0 });
});
