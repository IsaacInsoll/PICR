import File from '../models/File';
import { ThumbnailSize } from '../../frontend/src/helpers/thumbnailSize';
import { thumbnailPath } from './thumbnailPath';
import { ffmpegForFile } from './ffmpegForFile';
import { VideoMetadata } from '../types/MetadataSummary';
import { thumbnailDimensions } from '../../frontend/src/helpers/thumbnailDimensions';
import { existsSync } from 'node:fs';
import { logger } from '../logger';

export const generateVideoThumbnail = async (
  file: File,
  size: ThumbnailSize,
) => {
  const { Duration } = JSON.parse(file.metadata) as VideoMetadata;
  if (Duration <= 0 || !file.imageRatio || file.imageRatio == 0) {
    console.log('Error generating video thumbnails for: ' + file.fullPath());
    return;
  }

  const outFile = thumbnailPath(file, size);
  if (existsSync(outFile)) {
    //lets presume thumbnails already generated if this folder exists
    logger('Skipping ' + file.name + ' because video cache folder exists');
    return;
  }

  const px = thumbnailDimensions[size];
  logger('generating video thumbnails for ' + px + ' ' + file.name);

  const timemarks = Array(numberOfVideoSnapshots)
    .fill(0)
    .map((_, index) => (index / numberOfVideoSnapshots) * Duration);

  ffmpegForFile(file).takeScreenshots({
    filename: size + '.jpg',
    timemarks,
    folder: outFile,
    size: px + 'x' + Math.round(px / file.imageRatio), //size eg: '150x100',
  });
};

const numberOfVideoSnapshots = 10;
