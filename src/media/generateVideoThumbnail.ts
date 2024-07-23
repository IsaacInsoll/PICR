import File from '../models/File';
import { ThumbnailSize } from '../../frontend/src/helpers/thumbnailSize';
import { thumbnailPath } from './thumbnailPath';
import { ffmpegForFile } from './ffmpegForFile';
import { basename, dirname } from 'path';

export const generateVideoThumbnail = async (
  file: File,
  size: ThumbnailSize,
) => {
  const outFile = thumbnailPath(file, size);

  //thumbnail: working but doesn't do different sizes and hardcoded to 3 secs
  ffmpegForFile(file).takeScreenshots({
    filename: basename(outFile) + '.jpg',
    timemarks: [3],
    folder: dirname(outFile),
  });
  console.log(outFile);
};
