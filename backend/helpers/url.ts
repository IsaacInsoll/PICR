import { picrConfig } from '../config/picrConfig';
import { FileFields } from '../db/picrDb';
import { ThumbnailSize } from '../../frontend/src/helpers/thumbnailSize';

export const userUrlForFolder = (folderId: number) => {
  return picrConfig.baseUrl + 'admin/f/' + folderId;
};

export const userUrlForFile = (file: FileFields) => {
  return picrConfig.baseUrl + 'admin/f/' + file.folderId + '/' + file.id;
};

export const urlForImage = (file: FileFields, size: ThumbnailSize) => {
  if (file.type != 'Image') return undefined;
  return (
    picrConfig.baseUrl +
    `image/${file.id}/${size}/${file.fileHash}/${file.name}`
  );
};
