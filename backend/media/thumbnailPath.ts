import type { ThumbnailSize } from '@shared/thumbnailSize.js';
import { basename, dirname } from 'path';
import { fullPathForFile, relativePath } from '../filesystem/fileManager.js';
import { picrConfig } from '../config/picrConfig.js';
import type { FileFields } from '../db/picrDb.js';
import { videoPosterPath } from './videoThumbnailPaths.js';
import type { ThumbnailVariant as SharedThumbnailVariant } from '@shared/thumbnailVariants.js';

export const thumbnailPath = (
  file: FileFields,
  size: ThumbnailSize,
): string => {
  if (file.type === 'Video') {
    return videoPosterPath(file, size);
  }

  const fp = fullPathForFile(file);
  const fileName = basename(fp); // notes.txt
  const p = dirname(fp);

  const base = picrConfig.cachePath + `/thumbs/${relativePath(p)}/`;
  return `${base}${fileName}-${size}-${file.fileHash}.jpg`;
};

export const thumbnailVariantPath = (
  file: Pick<FileFields, 'fileHash' | 'name' | 'relativePath' | 'type'>,
  variant: Pick<SharedThumbnailVariant, 'extension' | 'token'>,
): string => {
  if (file.type === 'Video') {
    throw new Error('Use videoPosterVariantPath for video thumbnails');
  }

  const fp = fullPathForFile(file);
  const fileName = basename(fp);
  const p = dirname(fp);
  const base = picrConfig.cachePath + `/thumbs/${relativePath(p)}/`;
  return `${base}${fileName}-${variant.token}-${file.fileHash}${variant.extension}`;
};
