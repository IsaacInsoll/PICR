import sharp, { ResizeOptions } from 'sharp';
import { fullPath, relativePath } from '../filesystem/fileManager';
import { existsSync, mkdirSync } from 'node:fs';
import { basename, dirname, extname } from 'path';
import File from '../models/File';
import { thumbnailDimensions } from '../../frontend/src/helpers/thumbnailDimensions';
import {
  AllSize,
  ThumbnailSize,
  thumbnailSizes,
} from '../../frontend/src/helpers/thumbnailSize';
import { default as ex } from 'exif-reader';
import { MetadataSummary } from '../types/MetadataSummary';
import { logger } from '../logger';

const thumbnailPath = (file: File, size: ThumbnailSize): string => {
  const fp = file.fullPath();
  const ext = extname(fp); // .txt
  const fileName = basename(fp, ext); // notes.txt
  const p = dirname(fp);

  return (
    process.cwd() +
    `/cache/thumbs/${relativePath(p)}/${fileName}-${size}-${file.fileHash}${ext}`
  );
};

// Checks if thumbnail file exists and skips if it does so use `deleteAllThumbs` if you are wanting to update a file
export const generateAllThumbs = (file: File) => {
  thumbnailSizes.forEach((size: ThumbnailSize) => {
    const path = thumbnailPath(file, size as ThumbnailSize);
    if (!existsSync(path)) {
      generateThumbnail(file, size as ThumbnailSize);
    }
  });
};

//TODO: reimplement this using old hashes to find the thumbs to delete

// export const deleteAllThumbs = (filePath: string) => {
//   thumbnailSizes.forEach((size: ThumbnailSize) => {
//     const path = thumbnailPath(filePath, size as ThumbnailSize);
//     // console.log('Deleting Thumbnail: ' + path);
//     fs.rmSync(path, { force: true });
//   });
// };

export const generateThumbnail = (file: File, size: ThumbnailSize) => {
  logger(`🖼️ Generating ${size} thumbnail for ${file.name}`);
  const outFile = thumbnailPath(file, size);
  mkdirSync(dirname(outFile), { recursive: true });
  const px = thumbnailDimensions[size];
  return sharp(file.fullPath())
    .withMetadata()
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

export const getImageMetadata = async (filePath: string) => {
  try {
    const { exif } = await sharp(filePath).metadata();
    const x = ex(exif);
    // const et = x?.Photo?.ExposureTime;
    const result: MetadataSummary = {
      Camera: `${x?.Image?.Make} ${x?.Image?.Model}`,
      Lens: `${x?.Photo?.LensMake} ${x?.Photo?.LensModel}`,
      Artist: x?.Image.Artist,
      DateTimeEdit: x?.Image.DateTime,
      DateTimeOriginal: x?.Photo.DateTimeOriginal,
      Aperture: x?.Photo.FNumber,
      ExposureTime: x?.Photo.ExposureTime,
      // ShutterSpeed:
      //   et > 0
      //     ? et < 1
      //       ? '1/' + (1 / x?.Photo.ExposureTime).toString() + ' sec'
      //       : et.toFixed(2) + 'sec'
      //     : '',
      ISO: x?.Photo.ISOSpeedRatings,
    };
    return result;
  } catch (e) {
    console.log('Error getting metadata for file: ' + filePath);
    console.log(e);
    return null;
  }
  /* {
[js]   Image: {
[js]     Make: 'FUJIFILM',
[js]     Model: 'X-H2',
[js]     Software: 'Adobe Photoshop Lightroom Classic 12.3 (Windows)',
[js]     DateTime: 2023-07-03T18:33:15.000Z,
[js]     Artist: 'Isaac Insoll',
[js]   },
[js]   Photo: {
[js]     ExposureTime: 0.00037037037037037035, (1/2700 sec according to windows so do 1/thisnumber
[js]     FNumber: 1.2,
[js]     ISOSpeedRatings: 125,
[js]     DateTimeOriginal: 2023-07-01T11:13:14.000Z,
[js]     OffsetTimeOriginal: '+10:00',
[js]     ShutterSpeedValue: 11.398744,
[js]     ApertureValue: 0.526069,
[js]     FocalLength: 56,
[js]     FocalLengthIn35mmFilm: 84,
[js]     LensMake: 'FUJIFILM',
[js]     LensModel: 'XF56mmF1.2 R WR',
[js]   }
*/
};

const sharpOpts: ResizeOptions = {
  fit: 'inside', // clients probably get confused if thumbs are square crops rather than just smaller
  withoutEnlargement: true, //don't upsize in case the originals are low resolution (EG: proofs)
};

const jpegOptions = { quality: 60 };

export const fullPathFor = (file: File, size: AllSize): string => {
  if (!file.relativePath) {
    console.log(file);
  }
  const path = fullPath(file.relativePath) + '/' + file.name;
  if (size == 'raw') {
    return path;
  } else {
    return thumbnailPath(file, size);
  }
};
