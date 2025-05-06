import { MinimalFile } from '../../types.js';
import { AllSize, ThumbnailSize } from './thumbnailSize.js';
import { thumbnailDimensions } from './thumbnailDimensions.js';

export const imageURL = (
  file: Partial<Pick<MinimalFile, 'id' | 'fileHash' | 'name' | 'type'>>,
  size: AllSize,
  extension?: string,
  // frame?: number,
) => {
  const { id, fileHash, name, type } = file;

  const path = `/image/${id}/${size}/${fileHash}/`;
  if (type == 'Video' && size != 'raw') return path + `joined.jpg`;

  return path + (extension ? name + extension : name);
};

export const imageDimensions = (file: MinimalFile, size: ThumbnailSize) => {
  const { imageRatio } = file;
  const long = thumbnailDimensions[size];
  return { width: long, height: (long / (imageRatio ?? 1)).toFixed(0) };
};
