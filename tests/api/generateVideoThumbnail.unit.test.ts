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
  const runFfmpeg = vi.fn();

  vi.doMock('node:fs', async (importOriginal) => ({
    ...(await importOriginal<typeof import('node:fs')>()),
    existsSync: vi.fn((path: string) => existingPaths.includes(path)),
  }));
  vi.doMock('../../backend/media/encodeThumbnail.js', () => ({
    encodeThumbnail,
  }));
  vi.doMock('../../backend/media/ffmpeg.js', () => ({
    runFfmpeg,
  }));
  vi.doMock('../../backend/media/serverMediaSettings.js', () => ({
    getServerMediaSettings: vi.fn(async () => ({
      thumbnailJpegQuality: 60,
      thumbnailLargePx: 2500,
      thumbnailMediumPx: 500,
      thumbnailSmallPx: 250,
    })),
  }));
  vi.doMock('../../backend/logger.js', () => ({ log: vi.fn() }));

  const { generateVideoThumbnail } =
    await import('../../backend/media/generateVideoThumbnail.js');

  return { encodeThumbnail, generateVideoThumbnail, runFfmpeg };
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

test('regenerates missing video poster derivatives from cached baseline artifacts', async () => {
  const { encodeThumbnail, generateVideoThumbnail, runFfmpeg } =
    await loadGenerateVideoThumbnail({
      existingPaths: [
        '/cache/thumbs/videos/clip.mp4-v2-scrub-hash.jpg',
        '/cache/thumbs/videos/clip.mp4-v2-posterframe-hash.jpg',
        '/cache/thumbs/videos/clip.mp4-v2-sm-hash.jpg',
      ],
    });

  await generateVideoThumbnail(file(), 'md');

  expect(runFfmpeg).not.toHaveBeenCalled();
  expect(encodeThumbnail).toHaveBeenCalledTimes(2);
  expect(encodeThumbnail).toHaveBeenCalledWith(
    '/cache/thumbs/videos/clip.mp4-v2-posterframe-hash.jpg',
    'md',
    expect.any(Function),
    expect.any(Object),
  );
  expect(encodeThumbnail).toHaveBeenCalledWith(
    '/cache/thumbs/videos/clip.mp4-v2-posterframe-hash.jpg',
    'lg',
    expect.any(Function),
    expect.any(Object),
  );
});
