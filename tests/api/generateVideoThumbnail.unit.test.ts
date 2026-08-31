import { afterEach, expect, test, vi } from 'vitest';
import type { FileFields } from '../../backend/db/picrDb.js';

const file = (): FileFields =>
  ({
    blurHash: null,
    createdAt: new Date('2026-08-10T00:00:00.000Z'),
    duration: 12,
    exists: true,
    existsRescan: true,
    fileCreated: new Date('2026-08-10T00:00:00.000Z'),
    fileHash: 'hash',
    fileLastModified: new Date('2026-08-10T00:00:00.000Z'),
    fileSize: 1024,
    flag: null,
    folderId: 10,
    id: 1,
    imageWidth: null,
    imageHeight: null,
    imageRatio: 16 / 9,
    latestComment: null,
    metadata: JSON.stringify({ Duration: 12 }),
    name: 'clip.mp4',
    rating: 0,
    relativePath: 'videos',
    stIno: null,
    totalComments: 0,
    type: 'Video',
    updatedAt: new Date('2026-08-10T00:00:00.000Z'),
  }) satisfies FileFields;

const loadGenerateVideoThumbnail = async ({
  existingPaths,
}: {
  existingPaths: string[];
}) => {
  vi.resetModules();
  const { picrConfig } = await import('../../backend/config/picrConfig.js');
  picrConfig.cachePath = '/cache';
  picrConfig.mediaPath = '/media';

  const encodeThumbnail = vi.fn(async () => []);
  const encodeImageThumbnailVariants = vi.fn(async () => new Map());
  const runFfmpeg = vi.fn();

  vi.doMock('node:fs', async (importOriginal) => ({
    ...(await importOriginal<typeof import('node:fs')>()),
    existsSync: vi.fn((path: string) => existingPaths.includes(path)),
  }));
  vi.doMock('../../backend/media/encodeThumbnail.js', () => ({
    encodeThumbnail,
  }));
  vi.doMock('../../backend/media/encodeImageThumbnails.js', () => ({
    encodeImageThumbnailVariants,
  }));
  vi.doMock('../../backend/media/ffmpeg.js', () => ({
    runFfmpeg,
  }));
  vi.doMock('../../backend/media/serverMediaSettings.js', () => ({
    getServerMediaSettings: vi.fn(async () => ({
      thumbnailJpegQuality: 80,
    })),
  }));
  vi.doMock('../../backend/logger.js', () => ({ log: vi.fn() }));

  const { generateVideoThumbnail } =
    await import('../../backend/media/generateVideoThumbnail.js');

  return {
    encodeImageThumbnailVariants,
    encodeThumbnail,
    generateVideoThumbnail,
    runFfmpeg,
  };
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

test('regenerates missing video poster variants from cached baseline artifacts', async () => {
  const {
    encodeImageThumbnailVariants,
    encodeThumbnail,
    generateVideoThumbnail,
    runFfmpeg,
  } = await loadGenerateVideoThumbnail({
    existingPaths: [
      '/cache/thumbs/videos/clip.mp4-v2-scrub-hash.jpg',
      '/cache/thumbs/videos/clip.mp4-v2-posterframe-hash.jpg',
    ],
  });

  await generateVideoThumbnail(file(), 'md');

  expect(runFfmpeg).not.toHaveBeenCalled();
  expect(encodeThumbnail).not.toHaveBeenCalled();
  expect(encodeImageThumbnailVariants).toHaveBeenCalledOnce();
  expect(encodeImageThumbnailVariants).toHaveBeenCalledWith(
    '/cache/thumbs/videos/clip.mp4-v2-posterframe-hash.jpg',
    expect.arrayContaining([
      expect.objectContaining({ token: 'v1-250j80' }),
      expect.objectContaining({ token: 'v1-4000j80' }),
    ]),
    expect.any(Function),
  );
});

test('skips video poster variant regeneration when token cache exists', async () => {
  const {
    encodeImageThumbnailVariants,
    encodeThumbnail,
    generateVideoThumbnail,
    runFfmpeg,
  } = await loadGenerateVideoThumbnail({
    existingPaths: [
      '/cache/thumbs/videos/clip.mp4-v2-scrub-hash.jpg',
      '/cache/thumbs/videos/clip.mp4-v2-posterframe-hash.jpg',
      '/cache/thumbs/videos/clip.mp4-v1-250j80-hash.jpg',
      '/cache/thumbs/videos/clip.mp4-v1-500j80-hash.jpg',
      '/cache/thumbs/videos/clip.mp4-v1-750j80-hash.jpg',
      '/cache/thumbs/videos/clip.mp4-v1-1000j80-hash.jpg',
      '/cache/thumbs/videos/clip.mp4-v1-1500j80-hash.jpg',
      '/cache/thumbs/videos/clip.mp4-v1-2048j80-hash.jpg',
      '/cache/thumbs/videos/clip.mp4-v1-2560j80-hash.jpg',
      '/cache/thumbs/videos/clip.mp4-v1-4000j80-hash.jpg',
    ],
  });

  await generateVideoThumbnail(file(), 'md');

  expect(runFfmpeg).not.toHaveBeenCalled();
  expect(encodeThumbnail).not.toHaveBeenCalled();
  expect(encodeImageThumbnailVariants).not.toHaveBeenCalled();
});
