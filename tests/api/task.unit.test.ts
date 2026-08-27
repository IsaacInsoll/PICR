import { afterEach, expect, test, vi } from 'vitest';
import type { FolderPermissions } from '../../backend/types/FolderPermissions.js';

const loadTaskResolver = async (permissions: FolderPermissions) => {
  vi.resetModules();
  const folder = { id: 2 };
  const contextPermissions = vi.fn(async () => ({ folder, permissions }));
  const allSubfolderIds = vi.fn(async () => [2, 3]);
  const queueZipTaskStatus = vi.fn(() => [
    { id: 'zip-task', name: 'Zip Clients', status: 'Queued' },
  ]);
  const mediaScanTaskStatus = vi.fn(() => ({
    id: 'media-scan',
    name: 'Checking for new media…',
  }));
  const queueTaskStatus = vi.fn(() => ({
    id: 'media-import',
    name: 'Import Files and Generate Thumbnails',
    step: 0,
    totalSteps: 2,
  }));

  vi.doMock('../../backend/auth/contextPermissions.js', () => ({
    contextPermissions,
  }));
  vi.doMock('../../backend/helpers/allSubfolders.js', () => ({
    allSubfolderIds,
  }));
  vi.doMock('../../backend/helpers/zipQueue.js', () => ({
    queueZipTaskStatus,
  }));
  vi.doMock('../../backend/filesystem/mediaScanActivity.js', () => ({
    mediaScanTaskStatus,
  }));
  vi.doMock('../../backend/filesystem/fileQueue.js', () => ({
    queueTaskStatus,
  }));

  const { taskResolver } =
    await import('../../backend/graphql/queries/task.js');
  const result = await taskResolver(
    {},
    { folderId: 2 },
    {} as never,
    {} as never,
  );
  return {
    allSubfolderIds,
    mediaScanTaskStatus,
    queueTaskStatus,
    queueZipTaskStatus,
    result,
  };
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

test('folder-scoped admins receive ZIP, scan, and import tasks', async () => {
  const result = await loadTaskResolver('Admin');

  expect(result.result).toEqual([
    expect.objectContaining({ id: 'zip-task' }),
    expect.objectContaining({ id: 'media-scan' }),
    expect.objectContaining({ id: 'media-import' }),
  ]);
  expect(result.queueZipTaskStatus).toHaveBeenCalledWith([2, 3]);
  expect(result.mediaScanTaskStatus).toHaveBeenCalledOnce();
  expect(result.queueTaskStatus).toHaveBeenCalledOnce();
});

test('link users receive accessible ZIP tasks without global maintenance', async () => {
  const result = await loadTaskResolver('View');

  expect(result.result).toEqual([expect.objectContaining({ id: 'zip-task' })]);
  expect(result.mediaScanTaskStatus).not.toHaveBeenCalled();
  expect(result.queueTaskStatus).not.toHaveBeenCalled();
});
