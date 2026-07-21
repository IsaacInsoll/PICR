import { describe, expect, test } from 'vitest';
import type { FfprobeStream } from '../../backend/media/ffmpeg';
import {
  displayedDimensionsForVideoStream,
  shouldSwapDimensions,
} from '../../backend/media/getVideoMetadata';

describe('shouldSwapDimensions', () => {
  test.each([
    [0, false],
    [90, true],
    [-90, true],
    [180, false],
    [270, true],
    [360, false],
    [450, true],
  ])('returns %s degrees => %s', (rotation, expected) => {
    expect(shouldSwapDimensions(rotation)).toBe(expected);
  });
});

describe('displayedDimensionsForVideoStream', () => {
  test('swaps dimensions for rotate tags', () => {
    expect(
      displayedDimensionsForVideoStream(stream({ tags: { rotate: '90' } })),
    ).toEqual({ width: 1920, height: 1080 });
  });

  test('swaps dimensions for side data rotation', () => {
    expect(
      displayedDimensionsForVideoStream(
        stream({ side_data_list: [{ rotation: -90 }] }),
      ),
    ).toEqual({ width: 1920, height: 1080 });
  });

  test('keeps dimensions for unrotated streams', () => {
    expect(displayedDimensionsForVideoStream(stream())).toEqual({
      width: 1080,
      height: 1920,
    });
  });
});

const stream = (overrides: Partial<FfprobeStream> = {}): FfprobeStream => ({
  width: 1080,
  height: 1920,
  ...overrides,
});
