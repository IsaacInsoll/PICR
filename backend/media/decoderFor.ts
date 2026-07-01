import type { FileFields } from '../db/picrDb.js';
import { picrConfig } from '../config/picrConfig.js';
import {
  isHeicFormat,
  isPsbFormat,
  isPsdFormat,
  isRawFormat,
  isSharpReadableFormat,
} from '@shared/imageFormats.js';

export type ImageDecoder = 'none' | 'exiftool' | 'magick';

export const decoderFor = (file: FileFields): ImageDecoder => {
  if (isSharpReadableFormat(file.name)) return 'none';
  if (isRawFormat(file.name)) {
    if (picrConfig.mediaCaps.raw) return 'exiftool';
    throw new Error('RAW image decoding is not available');
  }
  if (isPsdFormat(file.name)) {
    if (picrConfig.mediaCaps.psd) return 'magick';
    throw new Error('PSD image decoding is not available');
  }
  if (isPsbFormat(file.name)) {
    if (picrConfig.mediaCaps.psb) return 'magick';
    throw new Error('PSB image decoding is not available');
  }
  if (isHeicFormat(file.name)) {
    if (picrConfig.mediaCaps.heic) return 'magick';
    throw new Error('HEIC image decoding is not available');
  }
  return 'none';
};
