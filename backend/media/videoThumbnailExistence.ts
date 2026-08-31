import { existsSync } from 'node:fs';
import type { FileFields } from '../db/picrDb.js';
import { videoPosterPath, videoScrubPath } from './videoThumbnailPaths.js';

export const videoThumbnailArtifactsExist = (file: FileFields): boolean => {
  const expectedPostersExist = (['sm', 'md', 'lg'] as const).every(
    (posterSize) => existsSync(videoPosterPath(file, posterSize)),
  );

  return existsSync(videoScrubPath(file)) && expectedPostersExist;
};
