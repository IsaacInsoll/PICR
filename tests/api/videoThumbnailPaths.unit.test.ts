import { expect, test } from 'vitest';
import { picrConfig } from '../../backend/config/picrConfig.js';
import { thumbnailVariantPaths } from '../../backend/media/thumbnailVariants.js';
import { videoPosterFramePathForParts } from '../../backend/media/videoThumbnailPaths.js';

test('video poster frame path is a versioned cache artifact', () => {
  picrConfig.cachePath = '/cache';

  expect(videoPosterFramePathForParts('videos', 'clip.mp4', 'hash')).toBe(
    '/cache/thumbs/videos/clip.mp4-v2-posterframe-hash.jpg',
  );
});

test('video cache variant enumeration includes the persisted poster frame', async () => {
  picrConfig.cachePath = '/cache';

  expect(
    (
      await thumbnailVariantPaths('videos', 'clip.mp4', 'hash', 'Video', {
        entries: async () => [
          {
            name: 'clip.mp4-v2-posterframe-hash.jpg',
            isDirectory: false,
            isFile: true,
          },
        ],
      })
    ).map(({ path }) => path),
  ).toContain('/cache/thumbs/videos/clip.mp4-v2-posterframe-hash.jpg');
});
