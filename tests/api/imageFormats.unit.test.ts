import { expect, test } from 'vitest';
import {
  isBrowserDisplayableOriginal,
  isDecodableImageFormat,
  isJxlFormat,
  isSharpReadableFormat,
} from '../../shared/imageFormats';

test.each([
  'photo.jxl',
  'PHOTO.JXL',
  '/exports/final/photo.JxL',
  'C:\\exports\\photo.jxl',
])(
  'JPEG XL uses a decoder and stays out of browser-original sources: %s',
  (name) => {
    expect(isJxlFormat(name)).toBe(true);
    expect(isDecodableImageFormat(name)).toBe(true);
    expect(isSharpReadableFormat(name)).toBe(false);
    expect(isBrowserDisplayableOriginal(name)).toBe(false);
  },
);

test.each(['.jxl', 'photo.jxl.jpg', '/folder.jxl/photo.jpg', 'photojxl'])(
  'does not mistake another filename for JPEG XL: %s',
  (name) => expect(isJxlFormat(name)).toBe(false),
);
