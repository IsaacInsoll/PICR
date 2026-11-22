import { afterEach, expect, test } from 'vitest';
import { picrConfig } from '../../backend/config/picrConfig';
import { decoderFor } from '../../backend/media/decoderFor';

const originalCaps = { ...picrConfig.mediaCaps };

afterEach(() => {
  picrConfig.mediaCaps = { ...originalCaps };
});

test.each(['photo.jxl', 'PHOTO.JXL'])(
  'requires the detected JXL capability even when other delegates are available: %s',
  (name) => {
    picrConfig.mediaCaps = {
      raw: true,
      psd: true,
      psb: true,
      heic: true,
      jxl: false,
    };
    expect(() => decoderFor({ name })).toThrow(
      'JXL image decoding is not available',
    );
    picrConfig.mediaCaps.jxl = true;
    expect(decoderFor({ name })).toBe('magick');
  },
);

test('adding JXL does not reroute native Sharp formats', () => {
  picrConfig.mediaCaps.jxl = true;
  expect(decoderFor({ name: 'photo.jpg' })).toBe('none');
});
