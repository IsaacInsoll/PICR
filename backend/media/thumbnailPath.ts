import { ThumbnailSize } from '../../frontend/src/helpers/thumbnailSize.js';
import { basename, dirname, extname } from 'path';
import { fullPathForFile, relativePath } from '../filesystem/fileManager.js';
import { picrConfig } from '../config/picrConfig.js';
import { FileFields } from '../db/picrDb.js';

export const thumbnailPath = (
  file: FileFields,
  size: ThumbnailSize,
  extension?: string,
): string => {
  const fp = fullPathForFile(file);
  const ext = extension ?? extname(fp); // .txt
  const fileName = basename(fp); // notes.txt
  const p = dirname(fp);

  // console.log('thumbnailPath', extension, ext);
  const base = picrConfig.cachePath + `/thumbs/${relativePath(p)}/`;
  // video is all in one folder, regardless of size
  // if (file.type == 'Video') {
  //   return `${base}${fileName}-${file.fileHash}${ext}`;
  // }
  return `${base}${fileName}-${size}-${file.fileHash}${ext}`;
};
