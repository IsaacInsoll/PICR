import type { JpegOptions, OutputInfo, ResizeOptions } from 'sharp';
import type { ThumbnailSize } from '@shared/thumbnailSize.js';
import { openSharp, type SharpInput } from './openSharp.js';
import { atomicWrite } from './atomicWrite.js';
import {
  serverThumbnailDimensions,
  type ServerMediaSettings,
} from '@shared/serverMediaSettings.js';
import { getServerMediaSettings } from './serverMediaSettings.js';

// Legacy per-size encoder retained for older tests/comparisons. Current image
// thumbnails and video poster variants use encodeImageThumbnails.ts so they can
// share the token-based ladder and decode-once batching.

type ThumbnailOutputExtension = '.jpg';

export type ThumbnailOutputPath = (
  extension: ThumbnailOutputExtension,
) => string;

export interface EncodeThumbnailOptions {
  settings?: ServerMediaSettings;
}

export const encodeThumbnail = async (
  input: SharpInput,
  size: ThumbnailSize,
  outputPath: ThumbnailOutputPath,
  options?: EncodeThumbnailOptions,
): Promise<OutputInfo[]> => {
  const settings = options?.settings ?? (await getServerMediaSettings());
  const px = serverThumbnailDimensions()[size];
  const jpgPath = outputPath('.jpg');

  const img = openSharp(input).withMetadata().resize(px, px, sharpOpts);

  const promises: Promise<OutputInfo>[] = [
    atomicWrite(jpgPath, (tempPath) =>
      img
        .clone()
        .jpeg({ ...jpegOptions, quality: settings.thumbnailJpegQuality })
        .toFile(tempPath),
    ),
  ];
  return Promise.all(promises);
};

const sharpOpts: ResizeOptions = {
  fit: 'inside', // clients probably get confused if thumbs are square crops rather than just smaller
  withoutEnlargement: true, //don't upsize in case the originals are low resolution (EG: proofs)
};

const jpegOptions: JpegOptions = {};
