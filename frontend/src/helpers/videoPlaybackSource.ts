import type { ImageUrlFileInput } from '@shared/types/ui';
import { imageURL, type ImageRouteSize } from './imageURL';

export const videoPlaybackSource = (file: ImageUrlFileInput) => {
  return imageURL(file, 'raw');
};

export const videoPosterURL = (
  file: ImageUrlFileInput,
  // undefined until the server-published variant ladder is known
  size: ImageRouteSize | undefined,
): string | undefined => {
  return size ? imageURL(file, size) : undefined;
};
