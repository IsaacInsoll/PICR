import { describe, expect, test } from 'vitest';
import { orientedImageDimensionsFromMetadata } from '../../backend/media/imageDimensions.js';

describe('orientedImageDimensionsFromMetadata', () => {
  test('keeps dimensions when orientation does not rotate by a quarter turn', () => {
    expect(
      orientedImageDimensionsFromMetadata({
        width: 6000,
        height: 4000,
        orientation: 1,
      }),
    ).toEqual({ width: 6000, height: 4000 });
  });

  test('swaps dimensions for EXIF orientations 5-8', () => {
    for (const orientation of [5, 6, 7, 8]) {
      expect(
        orientedImageDimensionsFromMetadata({
          width: 6000,
          height: 4000,
          orientation,
        }),
      ).toEqual({ width: 4000, height: 6000 });
    }
  });

  test('throws when metadata has no dimensions', () => {
    expect(() => orientedImageDimensionsFromMetadata({})).toThrow(
      'image metadata had no dimensions',
    );
  });
});
