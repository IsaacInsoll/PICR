import type {
  AvifOptions,
  JpegOptions,
  OutputInfo,
  ResizeOptions,
} from 'sharp';
import { thumbnailDimensions } from '@shared/thumbnailDimensions.js';
import type { ThumbnailSize } from '@shared/thumbnailSize.js';
import { getServerOptions } from '../db/picrDb.js';
import { openSharp, type SharpInput } from './openSharp.js';
import { atomicWrite } from './atomicWrite.js';

type ThumbnailOutputExtension = '.jpg' | '.avif';

export type ThumbnailOutputPath = (
  extension: ThumbnailOutputExtension,
) => string;

export interface EncodeThumbnailOptions {
  avifEnabled?: boolean;
}

export const encodeThumbnail = async (
  input: SharpInput,
  size: ThumbnailSize,
  outputPath: ThumbnailOutputPath,
  options?: EncodeThumbnailOptions,
): Promise<OutputInfo[]> => {
  const px = thumbnailDimensions[size];
  const jpgPath = outputPath('.jpg');

  const img = openSharp(input).withMetadata().resize(px, px, sharpOpts);
  const opts =
    options?.avifEnabled === undefined ? await getServerOptions() : null;
  const avifEnabled = options?.avifEnabled ?? opts?.avifEnabled ?? false;

  const promises: Promise<OutputInfo>[] = [
    atomicWrite(jpgPath, (tempPath) =>
      img.clone().jpeg(jpegOptions).toFile(tempPath),
    ),
  ];
  if (avifEnabled) {
    promises.push(
      atomicWrite(outputPath('.avif'), (tempPath) =>
        img.clone().avif(avifOptions).toFile(tempPath),
      ),
    );
  }
  return Promise.all(promises);
};

const sharpOpts: ResizeOptions = {
  fit: 'inside', // clients probably get confused if thumbs are square crops rather than just smaller
  withoutEnlargement: true, //don't upsize in case the originals are low resolution (EG: proofs)
};

const jpegOptions: JpegOptions = { quality: 60 };
const avifOptions: AvifOptions = { quality: 45 }; // avif 45 visually better than jpeg60 from looking at sooty-001 @ 50-80% file size of the jpeg
