import { existsSync } from 'node:fs';
import type { FileFields } from '../db/picrDb.js';
import { thumbnailSizes, type ThumbnailSize } from '@shared/thumbnailSize.js';
import {
  videoPosterFramePath,
  videoPosterPath,
  videoScrubPath,
} from './videoThumbnailPaths.js';

export const videoThumbnailBaselineArtifactsExist = (
  file: FileFields,
): boolean =>
  existsSync(videoScrubPath(file)) && existsSync(videoPosterFramePath(file));

export const missingVideoPosterSizes = (file: FileFields): ThumbnailSize[] =>
  thumbnailSizes.filter(
    (posterSize) => !existsSync(videoPosterPath(file, posterSize)),
  );
