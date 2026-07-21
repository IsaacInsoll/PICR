import { fullPath } from '../filesystem/fileManager.js';
import { existsSync } from 'node:fs';
import type { AllSize, ThumbnailSize } from '@shared/thumbnailSize.js';
import { log } from '../logger.js';
import { thumbnailPath } from './thumbnailPath.js';
import { generateVideoThumbnail } from './generateVideoThumbnail.js';
import type { FileFields } from '../db/picrDb.js';
import { ensureDecodedImage } from './ensureDecodedImage.js';
import { encodeThumbnail } from './encodeThumbnail.js';

// Checks if thumbnail file exists and skips if it does so use `deleteAllThumbs` if you are wanting to update a file
export const generateAllThumbs = async (file: FileFields) => {
  if (file.type === 'Image') {
    if (!existsSync(fullPathFor(file, 'sm'))) {
      await generateThumbnail(file, 'sm');
    }
    if (!existsSync(fullPathFor(file, 'md'))) {
      await generateThumbnail(file, 'md');
    }
    if (!existsSync(fullPathFor(file, 'lg'))) {
      await generateThumbnail(file, 'lg');
    }
  }

  if (file.type === 'Video') {
    try {
      await generateVideoThumbnail(file, 'md');
    } catch (e) {
      log(
        'error',
        `Error generating video thumbnails for ${file.name}: ${String(e)}`,
      );
    }
  }
  // thumbnailSizes.forEach((size: ThumbnailSize) => {
  //   const path = thumbnailPath(file, size as ThumbnailSize);
  //   if (!existsSync(path)) {
  //     generateThumbnail(file, size as ThumbnailSize);
  //   }
  // });
};

//TODO: reimplement this using old hashes to find the thumbs to delete

// export const deleteAllThumbs = (filePath: string) => {
//   thumbnailSizes.forEach((size: ThumbnailSize) => {
//     const path = thumbnailPath(filePath, size as ThumbnailSize);
//     // console.log('Deleting Thumbnail: ' + path);
//     fs.rmSync(path, { force: true });
//   });
// };

export const generateThumbnail = async (
  file: FileFields,
  size: ThumbnailSize,
) => {
  log('info', `🖼️ Generating ${size} thumbnail for ${file.name}`);
  try {
    const sourcePath = await ensureDecodedImage(file);
    return await encodeThumbnail(sourcePath, size, (extension) =>
      thumbnailPath(file, size, extension),
    );
  } catch (e) {
    log(
      'error',
      `Error generating ${size} thumbnail for ${file.name}: ${String(e)}`,
    );
  }
  return null;
};

export const fullPathFor = (
  file: FileFields,
  size: AllSize,
  extension?: string,
): string => {
  if (!file.relativePath) {
    log(
      'error',
      `File missing relativePath while resolving fullPathFor: ${file.id}`,
    );
  }
  const path = fullPath(file.relativePath) + '/' + file.name;
  if (size === 'raw') {
    return path;
  } else {
    return thumbnailPath(file, size, extension);
  }
};
