import File from '../models/File';
import { ThumbnailSize } from '../../frontend/src/helpers/thumbnailSize';
import { basename, dirname, extname } from 'path';
import { relativePath } from '../filesystem/fileManager';

export const thumbnailPath = (file: File, size: ThumbnailSize): string => {
  const fp = file.fullPath();
  const ext = extname(fp); // .txt
  const fileName = basename(fp, ext); // notes.txt
  const p = dirname(fp);

  return (
    process.cwd() +
    `/cache/thumbs/${relativePath(p)}/${fileName}-${size}-${file.fileHash}${ext}`
  );
};