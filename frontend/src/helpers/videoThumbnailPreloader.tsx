import { MinimalFile } from '../../types';
import { AllSize } from './thumbnailSize';
import { imageURL } from './imageURL';

export const videoThumbnailPreloader = (file: MinimalFile, size: AllSize) => {
  if (file.type !== 'Video' || size == 'raw') return;
  for (let i = 1; i <= 10; i++) {
    const imageElement = new Image();
    imageElement.src = imageURL(file, 'md', i);
  }
};
