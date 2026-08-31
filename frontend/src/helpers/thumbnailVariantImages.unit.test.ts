import type { ThumbnailVariantFragmentFragment } from '@shared/gql/graphql';
import { FileType } from '@shared/gql/graphql';
import { describe, expect, test } from 'vitest';
import {
  thumbnailImageCandidates,
  thumbnailRouteSizeForFileWidth,
  thumbnailRouteSizeForWidth,
  thumbnailSrcSet,
  thumbnailUrlForWidth,
} from './thumbnailVariantImages';

const variants: ThumbnailVariantFragmentFragment[] = [
  250, 500, 750, 1000, 1500, 2048, 2560, 4000,
].map((width) => ({
  token: `v1-${width}j80`,
  width,
  format: 'jpeg',
  mimeType: 'image/jpeg',
  quality: 80,
}));

const file = {
  id: '42',
  fileHash: 'image-hash',
  name: 'portrait.jpg',
  type: FileType.Image,
  imageWidth: 4000,
  imageHeight: 6000,
};

describe('responsive thumbnail variants', () => {
  test('uses rendered widths for portrait srcsets and route selection', () => {
    expect(
      thumbnailImageCandidates(file, variants.slice(1, 5)).map(
        ({ token, width, height }) => ({ token, width, height }),
      ),
    ).toEqual([
      { token: 'v1-500j80', width: 333, height: 500 },
      { token: 'v1-750j80', width: 500, height: 750 },
      { token: 'v1-1000j80', width: 667, height: 1000 },
      { token: 'v1-1500j80', width: 1000, height: 1500 },
    ]);

    expect(thumbnailRouteSizeForFileWidth(file, variants, 668)).toBe(
      'v1-1500j80',
    );
    expect(thumbnailSrcSet(file, variants.slice(1, 3))).toBe(
      '/image/42/v1-500j80/image-hash/portrait.jpg 333w, /image/42/v1-750j80/image-hash/portrait.jpg 500w',
    );
  });

  test('keeps the lowest rung when a small image clamps later variants', () => {
    const smallFile = { ...file, imageWidth: 300, imageHeight: 200 };

    expect(
      thumbnailImageCandidates(smallFile, variants).map(
        ({ token, width, height }) => ({ token, width, height }),
      ),
    ).toEqual([
      { token: 'v1-250j80', width: 250, height: 167 },
      { token: 'v1-500j80', width: 300, height: 200 },
    ]);
  });

  test('uses video metadata dimensions for poster candidates', () => {
    const video = {
      ...file,
      name: 'clip.mp4',
      type: FileType.Video,
      imageWidth: undefined,
      imageHeight: undefined,
      metadata: { Width: 1920, Height: 1080 },
    };

    expect(thumbnailRouteSizeForFileWidth(video, variants, 2560)).toBe(
      'v1-2048j80',
    );
    expect(thumbnailUrlForWidth(video, 2560, variants)).toContain(
      '/v1-2048j80/',
    );
  });

  test('omits srcset but preserves nominal src selection without dimensions', () => {
    const awaitingBackfill = {
      ...file,
      imageWidth: null,
      imageHeight: null,
      metadata: { Width: 6000, Height: 4000 },
    };

    expect(thumbnailSrcSet(awaitingBackfill, variants)).toBeUndefined();
    expect(
      thumbnailRouteSizeForFileWidth(awaitingBackfill, variants, 600),
    ).toBe('v1-750j80');
    expect(thumbnailRouteSizeForWidth(variants, 600)).toBe('v1-750j80');
    expect(thumbnailUrlForWidth(awaitingBackfill, 600, variants)).toContain(
      '/v1-750j80/',
    );
  });
});
