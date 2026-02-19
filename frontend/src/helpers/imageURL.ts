import { PicrFile } from '../../types.js';
import { AllSize } from './thumbnailSize.js';
import { withBasePath } from './baseHref';

export const imageURL = (
  file: Partial<Pick<PicrFile, 'id' | 'fileHash' | 'name' | 'type'>>,
  size: AllSize,
  extension?: string,
  // frame?: number,
) => {
  const { id, fileHash, name, type } = file;

  // if you change the path on the following line, also update imagePathFor in picrTemplate.ts (used by backend)
  const path = withBasePath(`/image/${id}/${size}/${fileHash}/`);
  if (type == 'Video' && size != 'raw') return path + `joined.jpg`;

  return path + (extension ? name + extension : name);
};

// export const imageDimensions = (file: PicrFile, size: ThumbnailSize) => {
//   const { imageRatio } = file;
//   const long = thumbnailDimensions[size];
//   return { width: long, height: (long / (imageRatio ?? 1)).toFixed(0) };
// };
