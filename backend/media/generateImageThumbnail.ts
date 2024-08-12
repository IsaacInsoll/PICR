import sharp, { AvifOptions, JpegOptions, ResizeOptions } from 'sharp';
import { fullPath } from '../filesystem/fileManager';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'path';
import File from '../models/File';
import { thumbnailDimensions } from '../../frontend/src/helpers/thumbnailDimensions';
import {
  AllSize,
  ThumbnailSize,
} from '../../frontend/src/helpers/thumbnailSize';
import { logger } from '../logger';
import { thumbnailPath } from './thumbnailPath';
import { generateVideoThumbnail } from './generateVideoThumbnail';

// Checks if thumbnail file exists and skips if it does so use `deleteAllThumbs` if you are wanting to update a file
export const generateAllThumbs = async (file: File) => {
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

export const generateThumbnail = async (file: File, size: ThumbnailSize) => {
  logger(`🖼️ Generating ${size} thumbnail for ${file.name}`);
  mkdirSync(dirname(thumbnailPath(file, size)), { recursive: true });
  const px = thumbnailDimensions[size];

  const img = sharp(file.fullPath()).withMetadata().resize(px, px, sharpOpts);
  try {
    return await Promise.all([
      img.jpeg(jpegOptions).toFile(thumbnailPath(file, size, '.jpg')),
      img.avif(avifOptions).toFile(thumbnailPath(file, size, '.avif')),
    ]);
  } catch (e) {
    console.log('Error generating thumbnail for: ' + file.fullPath());
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
  file: File,
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
