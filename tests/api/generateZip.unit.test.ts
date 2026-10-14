import { afterEach, expect, test, vi } from 'vitest';

const loadMutation = async () => {
  vi.resetModules();
  const log = vi.fn();
  const createAccessLog = vi.fn(async () => true);
  const sendFolderViewedNotification = vi.fn(async () => {});
  const hashFolderContents = vi.fn(async () => ({ hash: 'a'.repeat(64) }));
  const addToZipQueue = vi.fn();
  vi.doMock('../../backend/auth/contextPermissions.js', () => ({
    contextPermissions: async () => ({
      user: { id: 4, userType: 'Admin' },
      folder: { id: 2 },
    }),
  }));
  vi.doMock('../../backend/db/picrDb.js', () => ({
    createAccessLog,
    updateUserLastAccess: vi.fn(),
  }));
  vi.doMock('../../backend/notifications/notifications.js', () => ({
    sendFolderViewedNotification,
  }));
  vi.doMock('../../backend/helpers/zip.js', () => ({ hashFolderContents }));
  vi.doMock('../../backend/helpers/zipQueue.js', () => ({ addToZipQueue }));
  vi.doMock('../../backend/logger.js', () => ({ log }));
  const { generateZip } =
    await import('../../backend/graphql/mutations/generateZip.js');
  const request = () =>
    generateZip.resolve({}, { folderId: 2 }, {} as never, {} as never);
  return {
    request,
    log,
    createAccessLog,
    sendFolderViewedNotification,
    hashFolderContents,
    addToZipQueue,
  };
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

test('a failed mutation logs its stage and propagates the original error without enqueueing', async () => {
  const { request, log, sendFolderViewedNotification, addToZipQueue } =
    await loadMutation();
  const error = new Error('notification lookup failed');
  sendFolderViewedNotification.mockRejectedValueOnce(error);
  await expect(request()).rejects.toBe(error);
  expect(log).toHaveBeenCalledWith(
    'error',
    expect.stringContaining(
      'while sending download notifications: Error: notification lookup failed',
    ),
  );
  expect(addToZipQueue).not.toHaveBeenCalled();
});

test('an accepted request logs its hash and preserves the mutation response', async () => {
  const { request, log, addToZipQueue } = await loadMutation();
  await expect(request()).resolves.toBe('a'.repeat(64));
  expect(addToZipQueue).toHaveBeenCalledOnce();
  expect(log).toHaveBeenCalledWith(
    'info',
    expect.stringContaining('ZIP request accepted for folder 2'),
  );
});
