import type { JpegOptions, OutputInfo, ResizeOptions, Sharp } from 'sharp';
import type { ThumbnailSize } from '@shared/thumbnailSize.js';
import { openSharp, type SharpInput } from './openSharp.js';
import { atomicWrite } from './atomicWrite.js';
import {
  serverThumbnailDimensions,
  type ServerMediaSettings,
} from '@shared/serverMediaSettings.js';
import { getServerMediaSettings } from './serverMediaSettings.js';
import type {
  ThumbnailVariant,
  ThumbnailVariantExtension,
  ThumbnailVariantFormat,
  ThumbnailVariantToken,
} from '@shared/thumbnailVariants.js';
import { thumbnailVariantFormats } from '@shared/thumbnailVariants.js';

type LegacyThumbnailOutputExtension = '.jpg';

export type ImageThumbnailOutputPath = (
  size: ThumbnailSize,
  extension: LegacyThumbnailOutputExtension,
) => string;

export type ImageThumbnailResults = Map<ThumbnailSize, OutputInfo[] | null>;
export type ImageThumbnailVariantResults = Map<
  ThumbnailVariantToken,
  OutputInfo[] | null
>;

type ImageThumbnailVariantOutputPath = (
  variant: ThumbnailVariant,
  extension: ThumbnailVariantExtension,
) => string;

interface ImageThumbnailEncodeTarget<
  Key extends string,
  Extension extends string,
> {
  key: Key;
  width: number;
  format: ThumbnailVariantFormat;
  extension: Extension;
  quality: number;
}

type ImageThumbnailTargetResults<Key extends string> = Map<
  Key,
  OutputInfo[] | null
>;

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
  const dimensions = serverThumbnailDimensions();
  const targets: readonly ImageThumbnailEncodeTarget<
    ThumbnailSize,
    LegacyThumbnailOutputExtension
  >[] = sizes.map((size) => ({
    key: size,
    width: dimensions[size],
    format: thumbnailVariantFormats.jpeg.format,
    extension: thumbnailVariantFormats.jpeg.extension,
    quality: settings.thumbnailJpegQuality,
  }));

  return encodeImageThumbnailTargets(input, targets, (target) =>
    outputPath(target.key, target.extension),
  );
};

export const encodeImageThumbnailVariants = async (
  input: SharpInput,
  variants: readonly ThumbnailVariant[],
  outputPath: ImageThumbnailVariantOutputPath,
): Promise<ImageThumbnailVariantResults> => {
  const targets: readonly (ImageThumbnailEncodeTarget<
    ThumbnailVariantToken,
    ThumbnailVariantExtension
  > & { variant: ThumbnailVariant })[] = variants.map((variant) => ({
    key: variant.token,
    width: variant.width,
    format: variant.format,
    extension: variant.extension,
    quality: variant.quality,
    variant,
  }));

  return encodeImageThumbnailTargets(input, targets, (target) =>
    outputPath(target.variant, target.extension),
  );
};

const encodeImageThumbnailTargets = async <
  Key extends string,
  Extension extends string,
  Target extends ImageThumbnailEncodeTarget<Key, Extension>,
>(
  input: SharpInput,
  targets: readonly Target[],
  outputPath: (target: Target) => string,
): Promise<ImageThumbnailTargetResults<Key>> => {
  const decoded = await openSharp(input)
    .rotate()
    .toColorspace('srgb')
    .raw()
    .toBuffer({ resolveWithObject: true });
  const results: ImageThumbnailTargetResults<Key> = new Map();

  for (const target of targets) {
    const variantPath = outputPath(target);
    const img = openSharp(decoded.data, {
      raw: {
        width: decoded.info.width,
        height: decoded.info.height,
        channels: decoded.info.channels,
      },
    })
      .resize(target.width, target.width, sharpOpts)
      .withIccProfile('srgb');

    results.set(target.key, [
      await atomicWrite(variantPath, (tempPath) =>
        encodeThumbnailTarget(img, target, tempPath),
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

const encodeThumbnailTarget = (
  img: Sharp,
  target: ImageThumbnailEncodeTarget<string, string>,
  tempPath: string,
): Promise<OutputInfo> =>
  thumbnailEncoders[target.format](img, target, tempPath);

type ThumbnailEncoder = (
  img: Sharp,
  target: ImageThumbnailEncodeTarget<string, string>,
  tempPath: string,
) => Promise<OutputInfo>;

const thumbnailEncoders = {
  jpeg: (img, target, tempPath) =>
    img
      .clone()
      .jpeg({ ...jpegOptions, quality: target.quality })
      .toFile(tempPath),
} satisfies Record<ThumbnailVariantFormat, ThumbnailEncoder>;
