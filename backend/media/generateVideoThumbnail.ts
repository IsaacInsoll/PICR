import type { ThumbnailSize } from '@shared/thumbnailSize.js';
import type { PicrVideoMetadata } from '@shared/types/metadata.js';
import { log } from '../logger.js';
import { fullPathForFile } from '../filesystem/fileManager.js';
import type { FileFields } from '../db/picrDb.js';
import {
  videoPosterFramePath,
  videoPosterVariantPath,
  videoScrubPath,
} from './videoThumbnailPaths.js';
import { db } from '../db/picrDb.js';
import { dbFile } from '../db/models/index.js';
import { eq } from 'drizzle-orm';
import {
  missingVideoPosterVariants,
  videoThumbnailBaselineArtifactsExist,
} from './videoThumbnailExistence.js';
import { getServerMediaSettings } from './serverMediaSettings.js';
import {
  thumbnailVariantLadderForSettings,
  type ThumbnailVariant,
} from '@shared/thumbnailVariants.js';
import { encodeImageThumbnailVariants } from './encodeImageThumbnails.js';
import { generateVideoThumbnailArtifacts } from './videoThumbnailPipeline.js';

// This operation takes some time, and might be requested multiple times before it completes
// so lets queue it up
const videoThumbnailQueue: { [key: string]: Promise<void> } = {};

// Production video thumbnail generation is CPU-only for now. The admin benchmark
// keeps a VAAPI comparison row so future video work can re-check whether a
// hardware path is worth adding without changing this production path first.
const VIDEO_THUMBNAIL_CANDIDATE_PX = 500;

const processVideoThumbnail = async (
  file: FileFields,
  size: ThumbnailSize,
): Promise<void> => {
  if (!file.metadata) {
    throw new Error(
      `Cannot generate video thumbnails for ${file.name}: missing metadata`,
    );
  }
  const { Duration } = JSON.parse(file.metadata) as PicrVideoMetadata;
  if (!Duration || Duration <= 0 || !file.imageRatio || file.imageRatio === 0) {
    throw new Error(
      `Cannot generate video thumbnails for ${file.name}: invalid duration or image ratio (${fullPathForFile(file)})`,
    );
  }

  try {
    const settings = await getServerMediaSettings();
    const currentVariants = thumbnailVariantLadderForSettings(settings);
    if (videoThumbnailBaselineArtifactsExist(file)) {
      const missingPosterVariants = missingVideoPosterVariants(
        file,
        currentVariants,
      );
      if (missingPosterVariants.length > 0) {
        await encodeVideoPosterVariants(
          file,
          videoPosterFramePath(file),
          missingPosterVariants,
        );
      } else {
        log(
          'info',
          'Skipping ' + file.name + ' because video thumbnails exist',
        );
      }
      return;
    }

    const { blurHash } = await generateVideoThumbnailArtifacts({
      sourcePath: fullPathForFile(file),
      duration: Duration,
      thumbnailPx: VIDEO_THUMBNAIL_CANDIDATE_PX,
      scrubPath: videoScrubPath(file),
      posterFramePath: videoPosterFramePath(file),
      variants: currentVariants,
      posterVariantPath: (variant) => videoPosterVariantPath(file, variant),
    });
    if (blurHash) await persistVideoBlurHash(file, blurHash);
  } catch (e) {
    log(
      'error',
      'Error generating video thumbnails for ' + file.name + ' ' + size,
    );
    log('error', String(e));
    throw e;
  }
};

const encodeVideoPosterVariants = async (
  file: FileFields,
  posterFramePath: string,
  variants: readonly ThumbnailVariant[],
): Promise<void> => {
  if (variants.length === 0) return;

  await encodeImageThumbnailVariants(posterFramePath, variants, (variant) =>
    videoPosterVariantPath(file, variant),
  );
};

const persistVideoBlurHash = async (
  file: FileFields,
  blurHash: string,
): Promise<void> => {
  file.blurHash = blurHash;
  try {
    await db
      .update(dbFile)
      .set({ blurHash, updatedAt: new Date() })
      .where(eq(dbFile.id, file.id));
  } catch (error) {
    log(
      'error',
      `Error saving video blurhash for ${file.name}: ${String(error)}`,
    );
  }
};

export const generateVideoThumbnail = async (
  file: FileFields,
  size: ThumbnailSize,
): Promise<void> => {
  const pr = awaitVideoThumbnailGeneration(file, size);
  if (pr) return pr;

  const key = videoThumbnailQueueKey(file);
  const p = processVideoThumbnail(file, size).finally(() => {
    delete videoThumbnailQueue[key];
  });
  videoThumbnailQueue[key] = p;
  return p;
};

export const generateVideoThumbnailVariant = async (
  file: FileFields,
  variant: ThumbnailVariant,
): Promise<void> => {
  const currentQuality =
    (await getServerMediaSettings()).thumbnailJpegQuality === variant.quality;
  if (!currentQuality) {
    throw new Error(
      `Cannot generate stale video thumbnail variant ${variant.token}`,
    );
  }
  return generateVideoThumbnail(file, 'md');
};

export const awaitVideoThumbnailGeneration = (
  file: FileFields,
  size: ThumbnailSize,
): Promise<void> | undefined => {
  void size;
  return videoThumbnailQueue[videoThumbnailQueueKey(file)] ?? undefined;
};

const videoThumbnailQueueKey = (file: FileFields): string => String(file.id);
