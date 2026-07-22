import type { ImageUrlFileInput } from '@shared/types/ui';
import { imageURL } from './imageURL';

export const videoPlaybackSource = (file: ImageUrlFileInput) => {
  return imageURL(file, 'raw');
};

export const videoPosterURL = (file: ImageUrlFileInput) => {
  return imageURL(file, 'lg');
};
