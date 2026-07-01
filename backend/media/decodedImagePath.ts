import { basename, dirname } from 'path';
import { picrConfig } from '../config/picrConfig.js';
import type { FileFields } from '../db/picrDb.js';
import { fullPathForFile, relativePath } from '../filesystem/fileManager.js';

export const decodedImagePath = (file: FileFields): string => {
  const fp = fullPathForFile(file);
  const base = picrConfig.cachePath + `/thumbs/${relativePath(dirname(fp))}/`;
  return `${base}${basename(fp)}-decoded-${file.fileHash}.jpg`;
};
