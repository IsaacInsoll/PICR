import type { PicrFile } from '@shared/types/picr';
import type { AllSize } from '@shared/thumbnailSize';
import { imageURL, videoScrubURL } from './imageURL';

export const videoThumbnailPreloader = (file: PicrFile, size: AllSize) => {
  if (file.type !== 'Video' || size === 'raw') return;
  const posterElement = new Image();
  posterElement.src = imageURL(file, size, '.jpg');
  const scrubElement = new Image();
  scrubElement.src = videoScrubURL(file);
};
