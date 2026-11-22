import { basename, dirname } from 'path';
import { picrConfig } from '../config/picrConfig.js';
import type { FileFields } from '../db/picrDb.js';
import { fullPathForFile, relativePath } from '../filesystem/fileManager.js';
import type { ImageDecoder } from './decoderFor.js';
import { isJxlFormat } from '@shared/imageFormats.js';

const decodedCacheVariant = (decoder: Exclude<ImageDecoder, 'none'>): string =>
  decoder === 'exiftool' ? 'decoded-raw-v2' : 'decoded';

export const decodedImagePath = (
  file: Pick<FileFields, 'fileHash' | 'name' | 'relativePath'>,
  decoder: Exclude<ImageDecoder, 'none'>,
): string => {
  const fp = fullPathForFile(file);
  const base = picrConfig.cachePath + `/thumbs/${relativePath(dirname(fp))}/`;
  // JXL uses colour-managed sRGB PNG, with quantization after ICC conversion.
  // Isolate this from existing JPEG caches and unreleased v1 development caches.
  if (decoder === 'magick' && isJxlFormat(file.name)) {
    return `${base}${basename(fp)}-decoded-jxl-v2-${file.fileHash}.png`;
  }
  return `${base}${basename(fp)}-${decodedCacheVariant(decoder)}-${file.fileHash}.jpg`;
};
