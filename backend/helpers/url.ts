import { picrConfig } from '../config/picrConfig.js';
import type { FileFields } from '../db/picrDb.js';
import { thumbnailVariantForWidth } from '@shared/thumbnailVariants.js';
import type { ThumbnailVariantWidth } from '@shared/thumbnailVariants.js';
import { getServerMediaSettings } from '../media/serverMediaSettings.js';

export const userUrlForFolder = (folderId: number) => {
  return picrConfig.baseUrl + 'admin/f/' + folderId;
};

export const userUrlForFile = (file: FileFields) => {
  return picrConfig.baseUrl + 'admin/f/' + file.folderId + '/' + file.id;
};

export const urlForImage = async (
  file: FileFields,
  width: ThumbnailVariantWidth,
) => {
  if (file.type !== 'Image') return undefined;
  const settings = await getServerMediaSettings();
  const variant = thumbnailVariantForWidth(
    width,
    settings.thumbnailJpegQuality,
  );
  return (
    picrConfig.baseUrl +
    `image/${file.id}/${variant.token}/${file.fileHash}/${encodeURIComponent(file.name)}`
  );
};
