import type { ThumbnailSize } from '@shared/thumbnailSize.js';
import { thumbnailPath } from './thumbnailPath.js';
import { ffmpegForFile } from './ffmpegForFile.js';
import type { PicrVideoMetadata } from '@shared/types/metadata.js';
import { thumbnailDimensions } from '@shared/thumbnailDimensions.js';
import { existsSync, mkdirSync } from 'node:fs';
import { log } from '../logger.js';
// import joinImages from 'join-images'; TODO: find ES6 modules compatible alternative?
import * as ji from 'join-images';
import { fullPathForFile } from '../filesystem/fileManager.js';
import type { FileFields } from '../db/picrDb.js';

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
  const { Duration } = JSON.parse(file.metadata) as PicrVideoMetadata;
  if (!Duration || Duration <= 0 || !file.imageRatio || file.imageRatio == 0) {
    log(
      'error',
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

  return new Promise((resolve, reject) => {
    const p = thumbnailPath(file, size);
    mkdirSync(p, { recursive: true });

    try {
      ffmpegForFile(file)
        .on('end', () => {
          // console.log('⏸️ Screenshots done for ' + file.name + ' ' + size);
          mergeImages(file, size)
            .then(() => resolve())
            .catch(reject);
        })
        .on('error', (e) => {
          log(
            'error',
            'Error generating video thumbnails for ' + file.name + ' ' + size,
          );
          log('error', String(e));
          resolve();
        })
        .takeScreenshots({
          filename: size + '.jpg',
          timemarks,
          folder: outFile,
          size: px + 'x' + Math.round(px / (file.imageRatio ?? 1)), //size eg: '150x100',
        });
    } catch (e) {
      log(
        'error',
        'Caught error generating video thumbnails for ' +
          file.name +
          ' ' +
          size,
      );
      log('error', String(e));
    }
  });
};

const mergeImages = async (file: FileFields, size: ThumbnailSize) => {
  const outFile = thumbnailPath(file, size);

  const files = Array.from(
    { length: numberOfVideoSnapshots },
    (_, index) => `${outFile}/${size}_${index + 1}.jpg`,
  );
  const img = await ji.joinImages(files, { direction: 'vertical' });
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
