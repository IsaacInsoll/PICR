import { afterEach, expect, test, vi } from 'vitest';

const loadMutation = async () => {
  vi.resetModules();
  const log = vi.fn();
  const createAccessLog = vi.fn(async (): Promise<boolean> => true);
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
  const {
    request,
    log,
    hashFolderContents,
    sendFolderViewedNotification,
    addToZipQueue,
  } = await loadMutation();
  const error = new Error('folder lookup failed');
  hashFolderContents.mockRejectedValueOnce(error);
  await expect(request()).rejects.toBe(error);
  expect(log).toHaveBeenCalledWith(
    'error',
    expect.stringContaining(
      'while hashing folder contents: Error: folder lookup failed',
    ),
  );
  expect(addToZipQueue).not.toHaveBeenCalled();
  expect(sendFolderViewedNotification).not.toHaveBeenCalled();
});

test('a slow notification cannot delay the mutation response or ZIP queue', async () => {
  const { request, sendFolderViewedNotification, addToZipQueue } =
    await loadMutation();
  const notification = Promise.withResolvers<void>();
  sendFolderViewedNotification.mockReturnValueOnce(notification.promise);
  try {
    await expect(request()).resolves.toBe('a'.repeat(64));
    expect(addToZipQueue).toHaveBeenCalledOnce();
    expect(sendFolderViewedNotification).toHaveBeenCalledOnce();
    expect(addToZipQueue.mock.invocationCallOrder[0]).toBeLessThan(
      sendFolderViewedNotification.mock.invocationCallOrder[0],
    );
  } finally {
    notification.resolve();
  }
});

test('notification failures are logged without failing an accepted download', async () => {
  const { request, log, sendFolderViewedNotification, addToZipQueue } =
    await loadMutation();
  sendFolderViewedNotification.mockRejectedValueOnce(
    new Error('notification lookup failed'),
  );
  await expect(request()).resolves.toBe('a'.repeat(64));
  expect(addToZipQueue).toHaveBeenCalledOnce();
  await vi.waitFor(() =>
    expect(log).toHaveBeenCalledWith(
      'error',
      expect.stringContaining(
        'ZIP download notification failed for folder 2: Error: notification lookup failed',
      ),
    ),
  );
});

test('deduplicated download activity does not send another notification', async () => {
  const {
    request,
    createAccessLog,
    sendFolderViewedNotification,
    addToZipQueue,
  } = await loadMutation();
  createAccessLog.mockResolvedValueOnce(false);
  await expect(request()).resolves.toBe('a'.repeat(64));
  expect(addToZipQueue).toHaveBeenCalledOnce();
  expect(sendFolderViewedNotification).not.toHaveBeenCalled();
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
