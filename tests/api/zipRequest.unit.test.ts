import { afterEach, expect, test, vi } from 'vitest';

const loadRequest = async (inProgress = false, exists = true) => {
  vi.resetModules();
  const log = vi.fn();
  const dbFolderForId = vi.fn(async () => ({ id: 2 }));
  vi.doMock('../../backend/helpers/zip.js', () => ({
    zipPath: () => '/cache/gallery.zip',
  }));
  vi.doMock('../../backend/helpers/zipQueue.js', () => ({
    zipInProgress: () => inProgress,
  }));
  vi.doMock('../../backend/db/picrDb.js', () => ({ dbFolderForId }));
  vi.doMock('../../backend/logger.js', () => ({ log }));
  vi.doMock('node:fs', () => ({ existsSync: () => exists }));
  const { zipRequest } = await import('../../backend/express/zipRequest.js');
  const headers = new Map<string, string>();
  const res = {
    headersSent: false,
    set: vi.fn((name: string, value: string) => headers.set(name, value)),
    removeHeader: vi.fn((name: string) => headers.delete(name)),
    sendFile:
      vi.fn<(path: string, callback: (error?: Error) => void) => void>(),
    sendStatus: vi.fn(),
    destroy: vi.fn(),
  };
  const request = (hash = 'a'.repeat(64)) =>
    zipRequest(
      { params: { folderId: 2, hash, filename: 'Gallery' } } as never,
      res as never,
    );
  return { request, headers, res, log, dbFolderForId };
};

afterEach(() => {
  vi.doUnmock('node:fs');
  vi.resetModules();
});

test('a queued ZIP is retryable and uncacheable before any final file exists', async () => {
  const { request, headers, res } = await loadRequest(true, false);
  await request();
  expect(res.sendStatus).toHaveBeenCalledWith(503);
  expect(headers.get('Cache-Control')).toBe('no-store');
  expect(headers.get('Retry-After')).toBe('2');
  expect(res.sendFile).not.toHaveBeenCalled();
});

test('a missing ZIP is uncacheable', async () => {
  const { request, headers, res } = await loadRequest(false, false);
  await request();
  expect(res.sendStatus).toHaveBeenCalledWith(404);
  expect(headers.get('Cache-Control')).toBe('no-store');
});

test('a failed download logs the underlying error and removes immutable caching', async () => {
  const { request, headers, res, log } = await loadRequest();
  await request();
  expect(headers.get('Cache-Control')).toContain('immutable');
  const callback = res.sendFile.mock.calls[0][1];
  callback(new Error('EACCES'));
  expect(res.sendStatus).toHaveBeenCalledWith(500);
  expect(headers.get('Cache-Control')).toBe('no-store');
  expect(log).toHaveBeenCalledWith('error', expect.stringContaining('EACCES'));
});

test('a failure after download headers have been sent terminates the response', async () => {
  const { request, res } = await loadRequest();
  await request();
  res.headersSent = true;
  res.sendFile.mock.calls[0][1](new Error('connection interrupted'));
  expect(res.destroy).toHaveBeenCalledOnce();
  expect(res.sendStatus).not.toHaveBeenCalled();
});

test('invalid hashes cannot escape the ZIP cache directory', async () => {
  const { request, res, dbFolderForId } = await loadRequest();
  await request('../outside');
  expect(res.sendStatus).toHaveBeenCalledWith(400);
  expect(dbFolderForId).not.toHaveBeenCalled();
  expect(res.sendFile).not.toHaveBeenCalled();
});
