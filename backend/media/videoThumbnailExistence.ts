import { existsSync } from 'node:fs';
import type { FileFields } from '../db/picrDb.js';
import {
  videoPosterFramePath,
  videoPosterVariantPath,
  videoScrubPath,
} from './videoThumbnailPaths.js';
import type { ThumbnailVariant } from '@shared/thumbnailVariants.js';

export const videoThumbnailBaselineArtifactsExist = (
  file: FileFields,
): boolean =>
  existsSync(videoScrubPath(file)) && existsSync(videoPosterFramePath(file));

export const missingVideoPosterVariants = (
  file: FileFields,
  variants: readonly ThumbnailVariant[],
): ThumbnailVariant[] =>
  variants.filter(
    (variant) => !existsSync(videoPosterVariantPath(file, variant)),
  );
