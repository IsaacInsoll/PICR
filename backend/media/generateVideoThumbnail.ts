import { ThumbnailSize } from '../../frontend/src/helpers/thumbnailSize';
import { thumbnailPath } from './thumbnailPath';
import { ffmpegForFile } from './ffmpegForFile';
import { VideoMetadata } from '../types/MetadataSummary';
import { thumbnailDimensions } from '../../frontend/src/helpers/thumbnailDimensions';
import { existsSync } from 'node:fs';
import { log } from '../logger';
import joinImages from 'join-images';
import { range } from 'lodash';
import { fullPathForFile } from '../filesystem/fileManager';
import { FileFields } from '../db/picrDb';

const numberOfVideoSnapshots = 10;

// This operation takes some time, and might be requested multiple times before it completes
// so lets queue it up
const videoThumbnailQueue: { [key: string]: Promise<void> } = {};

const processVideoThumbnail = async (
  file: FileFields,
  size: ThumbnailSize,
): Promise<void> => {
  // lets only do medium thumbnails as large can just be 'embedded video' and small is probably useless?
  if (size != 'md') return;
  if (!file.metadata) return;
  const { Duration } = JSON.parse(file.metadata) as VideoMetadata;
  if (!Duration || Duration <= 0 || !file.imageRatio || file.imageRatio == 0) {
    console.log(
      'Error generating video thumbnails for: ' + fullPathForFile(file),
    );
    return;
  }

  const outFile = thumbnailPath(file, size);
  if (existsSync(outFile)) {
    //lets presume thumbnails already generated if this folder exists
    log('info', 'Skipping ' + file.name + ' because video cache folder exists');
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
        .on('end', (outFile) => {
          // console.log('⏸️ Screenshots done for ' + file.name + ' ' + size);
          mergeImages(file, size).then(() => resolve());
        })
        .on('error', (e) => {
          console.log(
            'Error generating video thumbnails for ' + file.name + ' ' + size,
          );
          console.log(e);
          resolve();
        })
        .takeScreenshots({
          filename: size + '.jpg',
          timemarks,
          folder: outFile,
          size: px + 'x' + Math.round(px / file.imageRatio!), //size eg: '150x100',
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

const mergeImages = async (file: FileFields, size: ThumbnailSize) => {
  const outFile = thumbnailPath(file, size);

  const files = range(1, 11).map((r) => `${outFile}/${size}_${r}.jpg`);
  console.log(files);
  const img = await joinImages(files, { direction: 'vertical' });
  await img.toFile(outFile + '/joined.jpg');
};

export const generateVideoThumbnail = async (
  file: FileFields,
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
  file: FileFields,
  size: ThumbnailSize,
): Promise<void> | undefined => {
  const key = file.id + '-' + size;
  return videoThumbnailQueue[key] ?? undefined;
};
