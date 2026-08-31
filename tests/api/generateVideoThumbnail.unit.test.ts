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

  const encodeImageThumbnailVariants = vi.fn(async () => new Map());
  const runFfmpeg = vi.fn();

  vi.doMock('node:fs', async (importOriginal) => ({
    ...(await importOriginal<typeof import('node:fs')>()),
    existsSync: vi.fn((path: string) => existingPaths.includes(path)),
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
    generateVideoThumbnail,
    runFfmpeg,
  };
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

test('regenerates missing video poster variants from cached baseline artifacts', async () => {
  const { encodeImageThumbnailVariants, generateVideoThumbnail, runFfmpeg } =
    await loadGenerateVideoThumbnail({
      existingPaths: [
        '/cache/thumbs/videos/clip.mp4-v2-scrub-hash.jpg',
        '/cache/thumbs/videos/clip.mp4-v2-posterframe-hash.jpg',
      ],
    });

  await generateVideoThumbnail(file(), 'md');

  expect(runFfmpeg).not.toHaveBeenCalled();
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
  const { encodeImageThumbnailVariants, generateVideoThumbnail, runFfmpeg } =
    await loadGenerateVideoThumbnail({
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
  expect(encodeImageThumbnailVariants).not.toHaveBeenCalled();
});

test('extracts video thumbnail candidates with one split ffmpeg process', async () => {
  vi.resetModules();
  const runFfmpeg = vi.fn();
  vi.doMock('../../backend/media/ffmpeg.js', () => ({
    runFfmpeg,
  }));

  const { extractCpuCandidateFrames } =
    await import('../../backend/media/videoThumbnailPipeline.js');

  await extractCpuCandidateFrames(
    '/media/videos/clip.mp4',
    12,
    [1, 2, 3],
    500,
    '/tmp/frames',
  );

  expect(runFfmpeg).toHaveBeenCalledOnce();
  const args = runFfmpeg.mock.calls[0]?.[0] as string[];
  expect(args).toContain(
    '[0:v]scale=w=500:h=500:force_original_aspect_ratio=decrease,split=3[s0][s1][s2]',
  );
  expect(args.filter((arg) => arg === '-frames:v')).toHaveLength(3);
  expect(args.filter((arg) => arg === '-q:v')).toHaveLength(3);
  expect(args).toEqual(
    expect.arrayContaining([
      '/tmp/frames/md_1.jpg',
      '/tmp/frames/md_2.jpg',
      '/tmp/frames/md_3.jpg',
    ]),
  );
});

test('extracts long video thumbnail candidates with bounded seek ffmpeg processes', async () => {
  vi.resetModules();
  const runFfmpeg = vi.fn();
  vi.doMock('../../backend/media/ffmpeg.js', () => ({
    runFfmpeg,
  }));

  const { extractCpuCandidateFrames } =
    await import('../../backend/media/videoThumbnailPipeline.js');

  await extractCpuCandidateFrames(
    '/media/videos/long-clip.mp4',
    90,
    [10, 45, 80],
    500,
    '/tmp/frames',
  );

  expect(runFfmpeg).toHaveBeenCalledTimes(3);
  expect(
    runFfmpeg.mock.calls.map(([args]) => (args as string[]).includes('-ss')),
  ).toEqual([true, true, true]);
  expect(
    runFfmpeg.mock.calls.map(([args]) =>
      (args as string[]).includes('-filter_complex'),
    ),
  ).toEqual([false, false, false]);
});

test('falls back to bounded seek extraction when split extraction fails', async () => {
  vi.resetModules();
  const runFfmpeg = vi.fn(async (args: string[]) => {
    if (args.includes('-filter_complex')) {
      throw new Error('split timed out');
    }
  });
  vi.doMock('../../backend/media/ffmpeg.js', () => ({
    runFfmpeg,
  }));

  const { extractCpuCandidateFrames } =
    await import('../../backend/media/videoThumbnailPipeline.js');

  const result = await extractCpuCandidateFrames(
    '/media/videos/clip.mp4',
    12,
    [1, 2, 3],
    500,
    '/tmp/frames',
  );

  expect(result.method).toBe('seek-loop');
  expect(runFfmpeg).toHaveBeenCalledTimes(4);
  expect(runFfmpeg.mock.calls[0]?.[0]).toContain('-filter_complex');
  expect(
    runFfmpeg.mock.calls
      .slice(1)
      .map(([args]) => (args as string[]).includes('-filter_complex')),
  ).toEqual([false, false, false]);
});
