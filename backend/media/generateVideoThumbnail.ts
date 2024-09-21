import File from '../models/File';
import { ThumbnailSize } from '../../frontend/src/helpers/thumbnailSize';
import { thumbnailPath } from './thumbnailPath';
import { ffmpegForFile } from './ffmpegForFile';
import { VideoMetadata } from '../types/MetadataSummary';
import { thumbnailDimensions } from '../../frontend/src/helpers/thumbnailDimensions';
import { existsSync } from 'node:fs';
import { log } from '../logger';

const numberOfVideoSnapshots = 10;

// This operation takes some time, and might be requested multiple times before it completes
// so lets queue it up
const videoThumbnailQueue: { [key: string]: Promise<void> } = {};

const processVideoThumbnail = async (
  file: File,
  size: ThumbnailSize,
): Promise<void> => {
  const { Duration } = JSON.parse(file.metadata) as VideoMetadata;
  if (Duration <= 0 || !file.imageRatio || file.imageRatio == 0) {
    console.log('Error generating video thumbnails for: ' + file.fullPath());
    return;
  }

  const outFile = thumbnailPath(file, size);
  if (existsSync(outFile)) {
    //lets presume thumbnails already generated if this folder exists
    log('Skipping ' + file.name + ' because video cache folder exists');
    return;
  }

  const px = thumbnailDimensions[size];
  // console.log('▶️ generating video thumbnails for ' + px + ' ' + file.name);

  const timemarks = Array(numberOfVideoSnapshots)
    .fill(0)
    .map((_, index) => (index / numberOfVideoSnapshots) * Duration);

  return new Promise((resolve) => {
    try {
      ffmpegForFile(file)
        .on('end', () => {
          // console.log('⏸️ Screenshots done for ' + file.name + ' ' + size);
          resolve(null);
        })
        .on('error', (e) => {
          console.log(
            'Error generating video thumbnails for ' + file.name + ' ' + size,
          );
          console.log(e);
          resolve(null);
        })
        .takeScreenshots({
          filename: size + '.jpg',
          timemarks,
          folder: outFile,
          size: px + 'x' + Math.round(px / file.imageRatio), //size eg: '150x100',
        });
    } catch (e) {
      console.log(
        'Caught error generating video thumbnails for ' +
          file.name +
          ' ' +
          size,
      );
      console.log(e);
    }
  });
};

export const generateVideoThumbnail = async (
  file: File,
  size: ThumbnailSize,
): Promise<void> => {
  const pr = awaitVideoThumbnailGeneration(file, size);
  if (pr) {
    // it's possible that we have rendered thumbnails (so promise exists) but since then the files were deleted
    await new Promise((r) => setTimeout(r, 1000));
    if (existsSync(thumbnailPath(file, size))) {
      return pr;
    }
  }
  const p = processVideoThumbnail(file, size);
  videoThumbnailQueue[file.id + '-' + size] = p;
  return p;
};

export const awaitVideoThumbnailGeneration = (
  file: File,
  size: ThumbnailSize,
): Promise<void> | undefined => {
  const key = file.id + '-' + size;
  return videoThumbnailQueue[key] ?? undefined;
};
