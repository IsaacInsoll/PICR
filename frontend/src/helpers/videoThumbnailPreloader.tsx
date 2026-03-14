import type { PicrFile } from '@shared/types/picr';
import type { AllSize } from '@shared/thumbnailSize';
import { imageURL } from './imageURL';

export const videoThumbnailPreloader = (file: PicrFile, size: AllSize) => {
  if (file.type !== 'Video' || size === 'raw') return;
  for (let frame = 1; frame <= 10; frame++) {
    const imageElement = new Image();
    imageElement.src = imageURL(file, 'md', '.jpg');
  }
};
