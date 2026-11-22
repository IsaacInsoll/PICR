import { afterEach, expect, test } from 'vitest';
import { picrConfig } from '../../backend/config/picrConfig';
import {
  imageDecodeAttemptKey,
  needsImagePromotion,
  nextMediaDecodeState,
} from '../../backend/media/mediaDecodeState';

const disabled = {
  raw: false,
  psd: false,
  psb: false,
  heic: false,
  jxl: false,
};
afterEach(() => {
  picrConfig.mediaCaps = { ...disabled };
  picrConfig.mediaDecodeState = undefined;
});

test('capability generations survive restarts and advance only on availability gain', () => {
  const initial = nextMediaDecodeState(null, { ...disabled, jxl: true });
  expect(initial.jxl).toEqual({ available: true, generation: 1 });
  const restarted = nextMediaDecodeState(JSON.parse(JSON.stringify(initial)), {
    ...disabled,
    jxl: true,
  });
  expect(restarted).toEqual(initial);
  const lost = nextMediaDecodeState(restarted, disabled);
  expect(lost.jxl).toEqual({ available: false, generation: 1 });
  const restored = nextMediaDecodeState(lost, { ...disabled, jxl: true });
  expect(restored.jxl).toEqual({ available: true, generation: 2 });
  expect(restored.raw).toEqual({ available: false, generation: 0 });
});

test.each([
  ['photo.CR2', 'raw'],
  ['photo.psd', 'psd'],
  ['photo.psb', 'psb'],
  ['photo.HEIF', 'heic'],
  ['photo.jxl', 'jxl'],
])(
  'promotion is durable per capability generation for %s',
  (name, capability) => {
    picrConfig.mediaCaps = {
      raw: true,
      psd: true,
      psb: true,
      heic: true,
      jxl: true,
    };
    picrConfig.mediaDecodeState = nextMediaDecodeState(
      null,
      picrConfig.mediaCaps,
    );
    expect(imageDecodeAttemptKey(name)).toBe(`${capability}:1`);
    expect(
      needsImagePromotion({ name, type: 'File', imageDecodeAttempt: null }),
    ).toBe(true);
    expect(
      needsImagePromotion({
        name,
        type: 'File',
        imageDecodeAttempt: `${capability}:1`,
      }),
    ).toBe(false);
    expect(
      needsImagePromotion({ name, type: 'Image', imageDecodeAttempt: null }),
    ).toBe(false);
    picrConfig.mediaCaps = { ...disabled };
    expect(
      needsImagePromotion({ name, type: 'File', imageDecodeAttempt: null }),
    ).toBe(false);
  },
);

test.each([
  'broken.jpg',
  'broken.png',
  'broken.tiff',
  'notes.txt',
  'movie.mp4',
])('a capability change never promotes %s', (name) => {
  picrConfig.mediaCaps = {
    raw: true,
    psd: true,
    psb: true,
    heic: true,
    jxl: true,
  };
  expect(imageDecodeAttemptKey(name)).toBeNull();
  expect(
    needsImagePromotion({ name, type: 'File', imageDecodeAttempt: null }),
  ).toBe(false);
});
