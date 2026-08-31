import type { ImageUrlFileInput } from '@shared/types/ui';
import type { AllSize } from '@shared/thumbnailSize';
import type { ThumbnailVariantToken } from '@shared/thumbnailVariants';
import { withBasePath } from './baseHref';

export type ImageRouteSize = AllSize | ThumbnailVariantToken;

export const imageURL = (
  file: ImageUrlFileInput,
  size: ImageRouteSize,
  extension?: string,
  // frame?: number,
) => {
  const { id, fileHash, name, type } = file;

  // if you change the path on the following line, also update imagePathFor in picrTemplate.ts (used by backend)
  const path = withBasePath(`/image/${id}/${size}/${fileHash}/`);
  if (type === 'Video' && size !== 'raw') {
    return path + 'poster.jpg';
  }

  const filename = extension ? name + extension : name;
  return path + encodeURIComponent(String(filename));
};

export const videoScrubURL = (file: ImageUrlFileInput) => {
  const { id, fileHash } = file;
  return withBasePath(`/image/${id}/scrub/${fileHash}/scrub.jpg`);
};

// export const imageDimensions = (file: PicrFile, size: ThumbnailSize) => {
//   const { imageRatio } = file;
//   const long = thumbnailDimensions[size];
//   return { width: long, height: (long / (imageRatio ?? 1)).toFixed(0) };
// };
