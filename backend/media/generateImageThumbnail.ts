import sharp, {
  AvifOptions,
  JpegOptions,
  OutputInfo,
  ResizeOptions,
} from 'sharp';
import { fullPath, fullPathForFile } from '../filesystem/fileManager.js';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'path';
import { thumbnailDimensions } from '../../shared/thumbnailDimensions.js';
import {
  AllSize,
  ThumbnailSize,
} from '../../frontend/src/helpers/thumbnailSize.js';
import { log } from '../logger.js';
import { thumbnailPath } from './thumbnailPath.js';
import { generateVideoThumbnail } from './generateVideoThumbnail.js';
import { FileFields, getServerOptions } from '../db/picrDb.js';

// Checks if thumbnail file exists and skips if it does so use `deleteAllThumbs` if you are wanting to update a file
export const generateAllThumbs = async (file: FileFields) => {
  if (file.type == 'Image') {
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

  if (file.type == 'Video') {
    await generateVideoThumbnail(file, 'sm');
    await generateVideoThumbnail(file, 'md');
    await generateVideoThumbnail(file, 'lg');
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
  mkdirSync(dirname(thumbnailPath(file, size)), { recursive: true });
  const px = thumbnailDimensions[size];
  const fullPath = fullPathForFile(file);

  const img = sharp(fullPath).withMetadata().resize(px, px, sharpOpts);

  const opts = await getServerOptions();

  try {
    const promises: Promise<OutputInfo>[] = [];
    promises.push(
      img.jpeg(jpegOptions).toFile(thumbnailPath(file, size, '.jpg')),
    );
    if (opts.avifEnabled) {
      promises.push(
        img.avif(avifOptions).toFile(thumbnailPath(file, size, '.avif')),
      );
    }
    return await Promise.all(promises);
  } catch (e) {
    console.log(e);
  }
  return null;
};

const sharpOpts: ResizeOptions = {
  fit: 'inside', // clients probably get confused if thumbs are square crops rather than just smaller
  withoutEnlargement: true, //don't upsize in case the originals are low resolution (EG: proofs)
};

const jpegOptions: JpegOptions = { quality: 60 };
const avifOptions: AvifOptions = { quality: 45 }; // avif 45 visually better than jpeg60 from looking at sooty-001 @ 50-80% file size of the jpeg

export const fullPathFor = (
  file: FileFields,
  size: AllSize,
  extension?: string,
): string => {
  if (!file.relativePath) {
    console.log(file);
  }
  const path = fullPath(file.relativePath) + '/' + file.name;
  if (size == 'raw') {
    return path;
  } else {
    return thumbnailPath(file, size, extension);
  }
};
