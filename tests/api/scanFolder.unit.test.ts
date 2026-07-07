import { mkdtemp, mkdir, rm, stat, utimes, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, expect, test, vi } from 'vitest';
import { contentHashForStats } from '../../backend/filesystem/fileHash';

interface MockFileRow {
  name: string;
  relativePath: string;
  fileHash: string | null;
  folderId?: number;
}

interface MockFolderRow {
  id: number;
  name: string;
  relativePath: string | null;
  parentId?: number | null;
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

const loadScanFolder = async ({
  mediaRoot,
  files = [],
  folders = [],
  folderRelativePath = '',
}: {
  mediaRoot: string;
  files?: MockFileRow[];
  folders?: MockFolderRow[];
  folderRelativePath?: string;
}) => {
  vi.resetModules();

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
  currentFolderId = 10;
  let nextFolderId = Math.max(...folderRows.map((folder) => folder.id)) + 1;

  const addFile = vi.fn();
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
  const log = vi.fn();

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
  vi.doMock('../../backend/logger.js', () => ({ log }));
  vi.doMock('../../backend/db/picrDb.js', () => ({
    dbFolderForId: vi.fn(async (id: number) => {
      currentFolderId = id;
      return folderRows.find((folder) => folder.id === id);
    }),
    db: {
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

  const { scanFolder } = await import('../../backend/filesystem/scanFolder.js');

  return {
    addFile,
    addFolder,
    log,
    removeFile,
    removeFolder,
    scanFolder,
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
  );
  expect(addFolder).toHaveBeenCalledOnce();
  expect(addFolder).toHaveBeenCalledWith(
    join(mediaRoot, 'New Folder'),
    expect.any(Object),
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
  );
  expect(result).toMatchObject({
    changedFiles: 1,
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
  });
});
