import { existsSync } from 'node:fs';
import type { FileFields } from '../db/picrDb.js';
import { videoPosterPath, videoScrubPath } from './videoThumbnailPaths.js';

export const videoThumbnailArtifactsExist = (
  file: FileFields,
  avifEnabled: boolean,
): boolean => {
  const expectedPostersExist =
    (['sm', 'md', 'lg'] as const).every((posterSize) =>
      existsSync(videoPosterPath(file, posterSize)),
    ) &&
    (!avifEnabled ||
      (['sm', 'md', 'lg'] as const).every((posterSize) =>
        existsSync(videoPosterPath(file, posterSize, '.avif')),
      ));

  return existsSync(videoScrubPath(file)) && expectedPostersExist;
};
