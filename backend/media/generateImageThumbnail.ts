import { fullPath } from '../filesystem/fileManager.js';
import { existsSync } from 'node:fs';
import type { AllSize, ThumbnailSize } from '@shared/thumbnailSize.js';
import { log } from '../logger.js';
import { thumbnailPath, thumbnailVariantPath } from './thumbnailPath.js';
import { generateVideoThumbnail } from './generateVideoThumbnail.js';
import type { FileFields } from '../db/picrDb.js';
import { ensureDecodedImage } from './ensureDecodedImage.js';
import {
  encodeImageThumbnailVariants,
  encodeImageThumbnails,
} from './encodeImageThumbnails.js';
import { getServerMediaSettings } from './serverMediaSettings.js';
import type { ServerMediaSettings } from '@shared/serverMediaSettings.js';
import type {
  ThumbnailVariant,
  ThumbnailVariantToken,
} from '@shared/thumbnailVariants.js';
import { thumbnailVariantLadderForSettings } from '@shared/thumbnailVariants.js';

type ImageThumbnailGeneration =
  Awaited<ReturnType<typeof encodeImageThumbnails>> extends Map<
    ThumbnailSize,
    infer Result
  >
    ? Result
    : never;

const inFlightImageThumbnails = new Map<
  string,
  Promise<ImageThumbnailGeneration>
>();

// Checks if thumbnail file exists and skips if it does so use `deleteAllThumbs` if you are wanting to update a file
export const generateAllThumbs = async (file: FileFields) => {
  if (file.type === 'Image') {
    const settings = await getServerMediaSettings();
    const missing = thumbnailVariantLadderForSettings(settings).filter(
      (variant) => !existsSync(thumbnailVariantPath(file, variant)),
    );
    if (missing.length > 0) {
      await generateThumbnailVariants(file, missing);
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
  settings?: ServerMediaSettings,
): Promise<ImageThumbnailGeneration> => {
  const [result] = await generateThumbnails(file, [size], settings);
  return result ?? null;
};

export const generateThumbnailVariant = async (
  file: FileFields,
  variant: ThumbnailVariant,
): Promise<ImageThumbnailGeneration> => {
  const [result] = await generateThumbnailVariants(file, [variant]);
  return result ?? null;
};

const generateThumbnails = async (
  file: FileFields,
  sizes: readonly ThumbnailSize[],
  settings?: ServerMediaSettings,
): Promise<ImageThumbnailGeneration[]> => {
  const promises: Promise<ImageThumbnailGeneration>[] = [];
  const missingSizes: ThumbnailSize[] = [];
  const seen = new Set<ThumbnailSize>();

  for (const size of sizes) {
    if (seen.has(size)) continue;
    seen.add(size);

    const inFlightKey = imageThumbnailGenerationKey(file, size);
    const existing = inFlightImageThumbnails.get(inFlightKey);
    if (existing) promises.push(existing);
    else missingSizes.push(size);
  }

  if (missingSizes.length > 0) {
    const setPromise = generateThumbnailsUnlocked(file, missingSizes, settings);
    for (const size of missingSizes) {
      const inFlightKey = imageThumbnailGenerationKey(file, size);
      const promise = setPromise
        .then((results) => results.get(size) ?? null)
        .finally(() => {
          inFlightImageThumbnails.delete(inFlightKey);
        });
      inFlightImageThumbnails.set(inFlightKey, promise);
      promises.push(promise);
    }
  }

  return Promise.all(promises);
};

const generateThumbnailVariants = async (
  file: FileFields,
  variants: readonly ThumbnailVariant[],
): Promise<ImageThumbnailGeneration[]> => {
  const promises: Promise<ImageThumbnailGeneration>[] = [];
  const missingVariants: ThumbnailVariant[] = [];
  const seen = new Set<ThumbnailVariantToken>();

  for (const variant of variants) {
    if (seen.has(variant.token)) continue;
    seen.add(variant.token);

    const inFlightKey = imageThumbnailGenerationKey(file, variant.token);
    const existing = inFlightImageThumbnails.get(inFlightKey);
    if (existing) promises.push(existing);
    else missingVariants.push(variant);
  }

  if (missingVariants.length > 0) {
    const setPromise = generateThumbnailVariantsUnlocked(file, missingVariants);
    for (const variant of missingVariants) {
      const inFlightKey = imageThumbnailGenerationKey(file, variant.token);
      const promise = setPromise
        .then((results) => results.get(variant.token) ?? null)
        .finally(() => {
          inFlightImageThumbnails.delete(inFlightKey);
        });
      inFlightImageThumbnails.set(inFlightKey, promise);
      promises.push(promise);
    }
  }

  return Promise.all(promises);
};

const generateThumbnailsUnlocked = async (
  file: FileFields,
  sizes: readonly ThumbnailSize[],
  settings?: ServerMediaSettings,
): Promise<Map<ThumbnailSize, ImageThumbnailGeneration>> => {
  for (const size of sizes) {
    log('info', `🖼️ Generating ${size} thumbnail for ${file.name}`);
  }
  try {
    const sourcePath = await ensureDecodedImage(file);
    return await encodeImageThumbnails(
      sourcePath,
      sizes,
      (size, extension) => thumbnailPath(file, size, extension),
      { settings },
    );
  } catch (e) {
    log(
      'error',
      `Error generating ${sizes.join(', ')} thumbnail${sizes.length === 1 ? '' : 's'} for ${file.name}: ${String(e)}`,
    );
  }
  return new Map(sizes.map((size) => [size, null]));
};

const generateThumbnailVariantsUnlocked = async (
  file: FileFields,
  variants: readonly ThumbnailVariant[],
): Promise<Map<ThumbnailVariantToken, ImageThumbnailGeneration>> => {
  for (const variant of variants) {
    log('info', `🖼️ Generating ${variant.token} thumbnail for ${file.name}`);
  }
  try {
    const sourcePath = await ensureDecodedImage(file);
    return await encodeImageThumbnailVariants(sourcePath, variants, (variant) =>
      thumbnailVariantPath(file, variant),
    );
  } catch (e) {
    log(
      'error',
      `Error generating ${variants.map(({ token }) => token).join(', ')} thumbnail${variants.length === 1 ? '' : 's'} for ${file.name}: ${String(e)}`,
    );
  }
  return new Map(variants.map((variant) => [variant.token, null]));
};

const imageThumbnailGenerationKey = (
  file: Pick<FileFields, 'fileHash' | 'id'>,
  key: ThumbnailSize | ThumbnailVariantToken,
): string => `${file.id}:${file.fileHash ?? ''}:${key}`;

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
