import { afterEach, expect, test, vi } from 'vitest';
import type { FolderHash } from '../../backend/helpers/zip.js';

const gallery = (id: number): FolderHash => ({
  hash: 'a'.repeat(64),
  key: id + 'a'.repeat(64),
  folder: {
    id,
    name: `Gallery ${id}`,
    title: null,
    subtitle: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    relativePath: `Gallery ${id}`,
    folderHash: null,
    stIno: null,
    exists: true,
    existsRescan: true,
    folderLastModified: new Date(),
    parentId: 1,
    heroImageId: null,
    bannerImageId: null,
    bannerSize: null,
    bannerTextHAlign: null,
    bannerTextVAlign: null,
    brandingId: null,
  },
});

const loadQueue = async (cached = false) => {
  vi.resetModules();
  const zipFolder = vi.fn(async (_folder: FolderHash) => {});
  const log = vi.fn();
  vi.doMock('../../backend/helpers/zip.js', () => ({
    zipFolder,
    zipPath: () => '/cache/gallery.zip',
  }));
  vi.doMock('../../backend/logger.js', () => ({ log }));
  vi.doMock('node:fs', () => ({ existsSync: () => cached }));
  const queue = await import('../../backend/helpers/zipQueue.js');
  return { queue, zipFolder, log };
};

afterEach(() => {
  vi.doUnmock('node:fs');
  vi.restoreAllMocks();
  vi.resetModules();
});

test('deduplicates running jobs, serializes galleries, continues after errors, and permits retry', async () => {
  const { queue, zipFolder, log } = await loadQueue();
  const first = gallery(2);
  const second = gallery(3);
  const pending = Promise.withResolvers<void>();
  zipFolder.mockImplementationOnce(() => pending.promise);
  queue.addToZipQueue(first);
  queue.addToZipQueue(first);
  queue.addToZipQueue(second);
  expect(zipFolder).toHaveBeenCalledTimes(1);
  expect(queue.queueZipTaskStatus(null).map((task) => task.status)).toEqual([
    'In Progress',
    'Queued',
  ]);
  expect(queue.zipInProgress(second)).toBe(true);

  pending.reject(
    Object.assign(new Error('ENOSPC: disk full'), { code: 'ENOSPC' }),
  );
  await vi.waitFor(() =>
    expect(queue.queueZipTaskStatus([3])[0].status).toBe('Complete'),
  );
  expect(queue.queueZipTaskStatus([2])[0]).toMatchObject({
    status: 'Error',
    errorCode: 'NO_SPACE',
  });
  expect(queue.zipInProgress(first)).toBe(false);
  expect(log).toHaveBeenCalledWith(
    'error',
    expect.stringContaining('ENOSPC: disk full'),
  );

  queue.addToZipQueue(first);
  await vi.waitFor(() =>
    expect(queue.queueZipTaskStatus([2])[0].status).toBe('Complete'),
  );
  expect(queue.queueZipTaskStatus([2])[0].errorCode).toBeUndefined();
  expect(zipFolder).toHaveBeenCalledTimes(3);
});

test('a completed cache hit avoids generation and is scoped to accessible folders', async () => {
  const { queue, zipFolder } = await loadQueue(true);
  queue.addToZipQueue(gallery(2));
  expect(queue.queueZipTaskStatus([2])[0].status).toBe('Complete');
  expect(queue.queueZipTaskStatus([3])).toEqual([]);
  expect(zipFolder).not.toHaveBeenCalled();
});

test.each([
  ['ENOSPC', 'NO_SPACE'],
  ['EDQUOT', 'NO_SPACE'],
  ['EACCES', 'PERMISSION_DENIED'],
  ['EROFS', 'PERMISSION_DENIED'],
  ['ENOENT', 'FILE_MISSING'],
  ['EIO', 'ZIP_FAILED'],
])(
  'classifies %s without exposing server paths to clients',
  async (code, expected) => {
    const { queue } = await loadQueue();
    expect(
      queue.zipErrorCode(
        Object.assign(new Error('/private/media/file.cr3'), { code }),
      ),
    ).toBe(expected);
  },
);
