import { afterEach, expect, test, vi } from 'vitest';
import type { Response } from 'express';

// Exercises the branch that answers a request when generation did not produce a
// file. Every branch routes through one responder so a status cannot be added
// without each caller handling it — video once fell through to sendCachedFile
// with a path that had never been written, answering an error while the
// day-long success Cache-Control header was still attached.
const loadImageRequest = async () => {
  vi.resetModules();
  vi.doMock('../../backend/db/picrDb.js', () => ({ db: {} }));
  vi.doMock('../../backend/logger.js', () => ({ log: vi.fn() }));
  return import('../../backend/express/imageRequest.js');
};

const mockResponse = () => {
  const headers = new Map<string, string>();
  const res = {
    headersSent: false,
    sendStatus: vi.fn(),
    set: vi.fn((name: string, value: string) => {
      headers.set(name, value);
      return res;
    }),
    removeHeader: vi.fn((name: string) => headers.delete(name)),
    sendFile: vi.fn(),
  };
  return { headers, res: res as unknown as Response & typeof res };
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

test('an ok status hands back to the caller without responding', async () => {
  const { respondToArtifactStatus } = await loadImageRequest();
  const { res } = mockResponse();

  expect(respondToArtifactStatus(res, 'ok', 404)).toBe(false);
  expect(res.sendStatus).not.toHaveBeenCalled();
  expect(res.sendFile).not.toHaveBeenCalled();
});

test('a missing artifact keeps its media-specific status code', async () => {
  const { respondToArtifactStatus } = await loadImageRequest();
  const { res } = mockResponse();

  // Video: generation legitimately produced nothing to serve.
  expect(respondToArtifactStatus(res, 'missing', 404)).toBe(true);
  expect(res.sendStatus).toHaveBeenLastCalledWith(404);

  // Image: a thumbnail missing after a successful generate is a server fault.
  expect(respondToArtifactStatus(res, 'missing', 500)).toBe(true);
  expect(res.sendStatus).toHaveBeenLastCalledWith(500);
});

test('a failed generation is always a 500', async () => {
  const { respondToArtifactStatus } = await loadImageRequest();
  const { res } = mockResponse();

  expect(respondToArtifactStatus(res, 'failed', 404)).toBe(true);
  expect(res.sendStatus).toHaveBeenLastCalledWith(500);
});

test('a failed send drops the success cache header before answering', async () => {
  const { sendCachedFile } = await loadImageRequest();
  const { headers, res } = mockResponse();

  sendCachedFile(res, '/cache/thumbs/missing.jpg', 'variant');
  expect(headers.get('Cache-Control')).toBe('public, max-age=86400');

  const [, callback] = res.sendFile.mock.calls[0] as [
    string,
    (error?: Error) => void,
  ];
  callback(new Error('ENOENT'));

  expect(headers.has('Cache-Control')).toBe(false);
  expect(res.sendStatus).toHaveBeenCalledWith(404);
});

test('a cached video artifact is served without waiting on generation', async () => {
  // The regression this guards: a warm cache hit used to await any in-flight
  // generation for the same video, so it could block behind unrelated
  // background work - or fail outright if that work errored - for a file that
  // was ready the whole time.
  vi.resetModules();
  const generateVideoThumbnail = vi.fn();
  const awaitVideoThumbnailGeneration = vi.fn();
  vi.doMock('../../backend/db/picrDb.js', () => ({ db: {} }));
  vi.doMock('../../backend/logger.js', () => ({ log: vi.fn() }));
  vi.doMock('node:fs', async (importOriginal) => ({
    ...(await importOriginal<typeof import('node:fs')>()),
    existsSync: vi.fn(() => true),
  }));
  vi.doMock('../../backend/media/generateVideoThumbnail.js', () => ({
    generateVideoThumbnail,
    generateVideoThumbnailVariant: vi.fn(),
    awaitVideoThumbnailGeneration,
  }));

  const { ensureVideoArtifact } =
    await import('../../backend/express/imageRequest.js');
  const file = { id: 1, name: 'clip.mp4' } as never;

  await expect(
    ensureVideoArtifact(file, 'md', '/cache/poster.jpg', 'poster'),
  ).resolves.toBe('ok');
  expect(generateVideoThumbnail).not.toHaveBeenCalled();
  expect(awaitVideoThumbnailGeneration).not.toHaveBeenCalled();
});
