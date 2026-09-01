import type { ThumbnailVariantFragmentFragment } from '@shared/gql/graphql';
import { FileType } from '@shared/gql/graphql';
import type { PicrFile } from '@shared/types/picr';
import { describe, expect, test } from 'vitest';
import { filesForLightbox } from './filesForLightbox';

const variants: ThumbnailVariantFragmentFragment[] = [
  500, 750, 1500, 2048, 2560, 4000,
].map((width) => ({
  token: `v1-${width}j80`,
  width,
  format: 'jpeg',
  mimeType: 'image/jpeg',
  quality: 80,
}));

const portrait: PicrFile = {
  id: '42',
  fileHash: 'image-hash',
  name: 'portrait.jpg',
  type: FileType.Image,
  imageWidth: 4000,
  imageHeight: 6000,
  imageRatio: 2 / 3,
};

describe('filesForLightbox', () => {
  test('publishes rendered image dimensions instead of nominal long edges', () => {
    expect(filesForLightbox([portrait], false, false, variants)).toMatchObject([
      {
        src: '/image/42/v1-4000j80/image-hash/portrait.jpg',
        width: 2667,
        height: 4000,
        srcSet: [
          { width: 333, height: 500 },
          { width: 500, height: 750 },
          { width: 1000, height: 1500 },
          { width: 1365, height: 2048 },
          { width: 1707, height: 2560 },
          { width: 2667, height: 4000 },
        ],
      },
    ]);
  });

  test('falls back to a plain largest-variant src when dimensions are unknown', () => {
    const awaitingBackfill = {
      ...portrait,
      imageWidth: null,
      imageHeight: null,
    };
    const [slide] = filesForLightbox(
      [awaitingBackfill],
      false,
      false,
      variants,
    );

    expect(slide).toMatchObject({
      src: '/image/42/v1-4000j80/image-hash/portrait.jpg',
    });
    expect(slide).not.toHaveProperty('srcSet');
    expect(slide).not.toHaveProperty('width');
    expect(slide).not.toHaveProperty('height');
  });

  test('uses the lowest native-width poster variant for videos', () => {
    const video: PicrFile = {
      ...portrait,
      name: 'clip.mp4',
      type: FileType.Video,
      imageWidth: 1920,
      imageHeight: 1080,
    };

    expect(filesForLightbox([video], false, false, variants)).toMatchObject([
      {
        type: 'picr-video',
        poster: '/image/42/v1-2048j80/image-hash/poster.jpg',
        thumbnail: '/image/42/v1-2048j80/image-hash/poster.jpg',
      },
    ]);
  });
});
