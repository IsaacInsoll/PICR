import { mkdtemp, mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, expect, test, vi } from 'vitest';
import { contentHashForStats } from '../../backend/filesystem/fileHash';

interface MockFileRow {
  name: string;
  relativePath: string;
  fileHash: string | null;
}

interface MockFolderRow {
  id: number;
  name: string;
  relativePath: string | null;
}

const mediaRoots: string[] = [];

const createMediaRoot = async () => {
  const mediaRoot = await mkdtemp(join(tmpdir(), 'picr-scan-folder-'));
  mediaRoots.push(mediaRoot);
  return mediaRoot;
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

  const addFile = vi.fn();
  const addFolder = vi.fn();
  const removeFile = vi.fn();
  const removeFolder = vi.fn();

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
  vi.doMock('../../backend/db/picrDb.js', () => ({
    dbFolderForId: vi.fn(async () => ({
      id: 10,
      name: 'Home',
      relativePath: folderRelativePath,
    })),
    db: {
      query: {
        dbFile: {
          findMany: vi.fn(async () => files),
        },
        dbFolder: {
          findMany: vi.fn(async () => folders),
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
    removeFile,
    removeFolder,
    scanFolder,
  };
};

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
  await writeFile(join(mediaRoot, 'new.jpg'), 'image');
  await mkdir(join(mediaRoot, 'New Folder'));
  await writeFile(join(mediaRoot, '.hidden.jpg'), 'hidden');
  await mkdir(join(mediaRoot, '@eaDir'));
  await writeFile(join(mediaRoot, 'Thumbs.db'), 'thumb cache');

  const { addFile, addFolder, scanFolder } = await loadScanFolder({
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
  await writeFile(join(mediaRoot, 'changed.jpg'), 'new content');

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
