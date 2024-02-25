import sharp, { ResizeOptions } from 'sharp';
import { fullPath, relativePath } from '../filesystem/fileManager';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'path';
import {
  AllSize,
  thumbnailDimensions,
  ThumbnailSize,
  thumbnailSizes,
} from './thumbnailSizes';
import fs from 'fs';
import { File } from '../models/file';

const thumbnailPath = (filePath: string, size: ThumbnailSize) => {
  return process.cwd() + `/data/thumbs/${size}/${relativePath(filePath)}`;
};

// Checks if thumbnail file exists and skips if it does so use `deleteAllThumbs` if you are wanting to update a file
export const generateAllThumbs = (filePath: string) => {
  thumbnailSizes.forEach((size: ThumbnailSize) => {
    const path = thumbnailPath(filePath, size as ThumbnailSize);
    if (!existsSync(path)) {
      generateThumbnail(filePath, size as ThumbnailSize);
    }
  });
};

export const deleteAllThumbs = (filePath: string) => {
  thumbnailSizes.forEach((size: ThumbnailSize) => {
    const path = thumbnailPath(filePath, size as ThumbnailSize);
    // console.log('Deleting Thumbnail: ' + path);
    fs.rmSync(path, { force: true });
  });
};

export const generateThumbnail = (filePath: string, size: ThumbnailSize) => {
  const outFile = thumbnailPath(filePath, size);
  mkdirSync(dirname(outFile), { recursive: true });
  const px = thumbnailDimensions[size];
  sharp(filePath)
    .resize(px, px, sharpOpts)
    .jpeg(jpegOptions)
    .toFile(outFile)
    .then((output) => {
      // console.log(output);
    })
    .catch((err) => {
      console.log('sharp error');
      console.log(err);
    });
};

export const getImageRatio = async (filePath: string) => {
  const image = sharp(filePath);
  const { width, height } = await image.metadata();
  return height > 0 ? width / height : 0;
};

const sharpOpts: ResizeOptions = {
  fit: 'inside', // clients probably get confused if thumbs are square crops rather than just smaller
  withoutEnlargement: true, //don't upsize in case the originals are low resolution (EG: proofs)
};

const jpegOptions = { quality: 60 };

export const fullPathFor = (file: File, size: AllSize): string => {
  const path = fullPath(file.relativePath) + '/' + file.name;
  if (size == 'raw') {
    return path;
  } else {
    return thumbnailPath(path, size);
  }
};
