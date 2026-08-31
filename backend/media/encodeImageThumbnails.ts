import type { JpegOptions, OutputInfo, ResizeOptions } from 'sharp';
import type { ThumbnailSize } from '@shared/thumbnailSize.js';
import { openSharp, type SharpInput } from './openSharp.js';
import { atomicWrite } from './atomicWrite.js';
import {
  serverThumbnailDimensions,
  type ServerMediaSettings,
} from '@shared/serverMediaSettings.js';
import { getServerMediaSettings } from './serverMediaSettings.js';

type ThumbnailOutputExtension = '.jpg';

export type ImageThumbnailOutputPath = (
  size: ThumbnailSize,
  extension: ThumbnailOutputExtension,
) => string;

export type ImageThumbnailResults = Map<ThumbnailSize, OutputInfo[] | null>;

export interface EncodeImageThumbnailsOptions {
  settings?: ServerMediaSettings;
}

export const encodeImageThumbnails = async (
  input: SharpInput,
  sizes: readonly ThumbnailSize[],
  outputPath: ImageThumbnailOutputPath,
  options?: EncodeImageThumbnailsOptions,
): Promise<ImageThumbnailResults> => {
  const settings = options?.settings ?? (await getServerMediaSettings());
  const dimensions = serverThumbnailDimensions(settings);
  const decoded = await openSharp(input)
    .rotate()
    .toColorspace('srgb')
    .raw()
    .toBuffer({ resolveWithObject: true });
  const results: ImageThumbnailResults = new Map();

  for (const size of sizes) {
    const px = dimensions[size];
    const jpgPath = outputPath(size, '.jpg');
    const img = openSharp(decoded.data, {
      raw: {
        width: decoded.info.width,
        height: decoded.info.height,
        channels: decoded.info.channels,
      },
    })
      .resize(px, px, sharpOpts)
      .withIccProfile('srgb');

    results.set(size, [
      await atomicWrite(jpgPath, (tempPath) =>
        img
          .clone()
          .jpeg({ ...jpegOptions, quality: settings.thumbnailJpegQuality })
          .toFile(tempPath),
      ),
    ]);
  }

  return results;
};

const sharpOpts: ResizeOptions = {
  fit: 'inside',
  withoutEnlargement: true,
};

const jpegOptions: JpegOptions = {};
