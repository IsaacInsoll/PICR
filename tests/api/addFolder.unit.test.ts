import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';

const mediaRoots: string[] = [];

const createMediaRoot = async () => {
  const mediaRoot = await mkdtemp(join(tmpdir(), 'picr-add-folder-'));
  mediaRoots.push(mediaRoot);
  return mediaRoot;
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

test('addFolder reactivates an archived folder row even when existsRescan is already true', async () => {
  vi.resetModules();

  const mediaRoot = await createMediaRoot();
  const folderPath = join(mediaRoot, 'Replaced Folder');
  await mkdir(folderPath);

  const root = {
    id: 1,
    name: 'Home',
    exists: true,
    existsRescan: true,
    folderLastModified: new Date('2026-01-01T00:00:00Z'),
    relativePath: null,
    parentId: null,
  };
  const archivedFolder = {
    id: 47,
    name: 'Replaced Folder',
    exists: false,
    existsRescan: true,
    folderLastModified: new Date('2026-01-01T00:00:00Z'),
    relativePath: 'Replaced Folder',
    parentId: 1,
  };
  const findFirst = vi
    .fn()
    .mockResolvedValueOnce(root)
    .mockResolvedValueOnce(archivedFolder);
  const where = vi.fn(async () => undefined);
  const set = vi.fn(() => ({ where }));
  const update = vi.fn(() => ({ set }));

  vi.doMock('../../backend/db/picrDb.js', () => ({
    db: {
      update,
      query: {
        dbFolder: {
          findFirst,
        },
      },
    },
  }));
  vi.doMock('../../backend/filesystem/events/updateFolderHash.js', () => ({
    updateFolderHash: vi.fn(),
  }));

  const { picrConfig } = await import('../../backend/config/picrConfig.js');
  picrConfig.mediaPath = mediaRoot;

  const { addFolder, setupRootFolder } =
    await import('../../backend/filesystem/events/addFolder.js');

  await setupRootFolder();

  await expect(addFolder(folderPath)).resolves.toBe(47);
  expect(set).toHaveBeenCalledWith(
    expect.objectContaining({
      exists: true,
      existsRescan: true,
      folderLastModified: expect.any(Date),
    }),
  );
  expect(archivedFolder).toMatchObject({
    exists: true,
    existsRescan: true,
  });
});
