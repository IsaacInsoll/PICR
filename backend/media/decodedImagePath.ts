import { basename, dirname } from 'path';
import { picrConfig } from '../config/picrConfig.js';
import type { FileFields } from '../db/picrDb.js';
import { fullPathForFile, relativePath } from '../filesystem/fileManager.js';
import type { ImageDecoder } from './decoderFor.js';

const decodedCacheVariant = (decoder: Exclude<ImageDecoder, 'none'>): string =>
  decoder === 'exiftool' ? 'decoded-raw-v2' : 'decoded';

export const decodedImagePath = (
  file: Pick<FileFields, 'fileHash' | 'name' | 'relativePath'>,
  decoder: Exclude<ImageDecoder, 'none'>,
): string => {
  const fp = fullPathForFile(file);
  const base = picrConfig.cachePath + `/thumbs/${relativePath(dirname(fp))}/`;
  return `${base}${basename(fp)}-${decodedCacheVariant(decoder)}-${file.fileHash}.jpg`;
};
