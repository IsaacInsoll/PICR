import { fullPath } from '../filesystem/fileManager.js';
import { existsSync } from 'node:fs';
import type { AllSize, ThumbnailSize } from '@shared/thumbnailSize.js';
import { thumbnailSizes } from '@shared/thumbnailSize.js';
import { log } from '../logger.js';
import { thumbnailPath } from './thumbnailPath.js';
import { generateVideoThumbnail } from './generateVideoThumbnail.js';
import type { FileFields } from '../db/picrDb.js';
import { ensureDecodedImage } from './ensureDecodedImage.js';
import { encodeImageThumbnails } from './encodeImageThumbnails.js';
import { getServerMediaSettings } from './serverMediaSettings.js';
import type { ServerMediaSettings } from '@shared/serverMediaSettings.js';

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
    // Thumbnail settings are intentionally not part of the current disk cache
    // filename. Existing sm/md/lg files are reused until deleted/regenerated;
    // only missing thumbnails are generated with the latest server settings.
    const missing = thumbnailSizes.filter(
      (size) => !existsSync(fullPathFor(file, size)),
    );
    if (missing.length > 0) {
      const settings = await getServerMediaSettings();
      await generateThumbnails(file, missing, settings);
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

const imageThumbnailGenerationKey = (
  file: Pick<FileFields, 'fileHash' | 'id'>,
  size: ThumbnailSize,
): string => `${file.id}:${file.fileHash ?? ''}:${size}`;

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
