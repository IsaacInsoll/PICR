import type { ThumbnailSize } from '@shared/thumbnailSize.js';
import { basename, dirname, extname } from 'path';
import { fullPathForFile, relativePath } from '../filesystem/fileManager.js';
import { picrConfig } from '../config/picrConfig.js';
import type { FileFields } from '../db/picrDb.js';

export const VIDEO_THUMBNAIL_CACHE_VERSION = 2;

export type VideoThumbnailExtension = '.jpg' | '.avif';

export const videoPosterPath = (
  file: FileFields,
  size: ThumbnailSize,
  extension: VideoThumbnailExtension = '.jpg',
): string => {
  const fp = fullPathForFile(file);
  const fileName = basename(fp);
  const p = dirname(fp);
  return videoPosterPathForParts(
    relativePath(p),
    fileName,
    file.fileHash ?? '',
    size,
    extension,
  );
};

export const videoScrubPath = (file: FileFields): string => {
  const fp = fullPathForFile(file);
  const fileName = basename(fp);
  const p = dirname(fp);
  return videoScrubPathForParts(relativePath(p), fileName, file.fileHash ?? '');
};

export const videoPosterPathForParts = (
  relativePath: string,
  name: string,
  hash: string,
  size: ThumbnailSize,
  extension: VideoThumbnailExtension = '.jpg',
): string => {
  const base = picrConfig.cachePath + `/thumbs/${relativePath}/`;
  return `${base}${name}-v${VIDEO_THUMBNAIL_CACHE_VERSION}-${size}-${hash}${extension}`;
};

export const videoScrubPathForParts = (
  relativePath: string,
  name: string,
  hash: string,
): string => {
  const base = picrConfig.cachePath + `/thumbs/${relativePath}/`;
  return `${base}${name}-v${VIDEO_THUMBNAIL_CACHE_VERSION}-scrub-${hash}.jpg`;
};

export const legacyVideoMontagePathForParts = (
  relativePath: string,
  name: string,
  hash: string,
  size: ThumbnailSize,
): string => {
  const base = picrConfig.cachePath + `/thumbs/${relativePath}/`;
  return `${base}${name}-${size}-${hash}${extname(name)}`;
};
