import { expect, test } from 'vitest';
import { pickPosterFrame } from '../../backend/media/pickPosterFrame';

test('pickPosterFrame rejects black frames and prefers the middle survivor', () => {
  expect(
    pickPosterFrame([
      { lumaMean: 0, lumaStdev: 0 },
      { lumaMean: 0, lumaStdev: 0 },
      { lumaMean: 0, lumaStdev: 0 },
      { lumaMean: 0, lumaStdev: 0 },
      { lumaMean: 80, lumaStdev: 22 },
    ]),
  ).toBe(4);
});

test('pickPosterFrame rejects flat low-detail frames', () => {
  expect(
    pickPosterFrame([
      { lumaMean: 80, lumaStdev: 1 },
      { lumaMean: 90, lumaStdev: 2 },
      { lumaMean: 100, lumaStdev: 1 },
      { lumaMean: 110, lumaStdev: 20 },
      { lumaMean: 120, lumaStdev: 1 },
    ]),
  ).toBe(3);
});

test('pickPosterFrame falls back to the middle candidate when all fail', () => {
  expect(
    pickPosterFrame([
      { lumaMean: 0, lumaStdev: 0 },
      { lumaMean: 90, lumaStdev: 1 },
      { lumaMean: 3, lumaStdev: 2 },
      { lumaMean: 120, lumaStdev: 0 },
    ]),
  ).toBe(2);
});
