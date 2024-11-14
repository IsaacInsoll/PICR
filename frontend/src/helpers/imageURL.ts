import { MinimalFile } from '../../types';
import { AllSize, ThumbnailSize } from './thumbnailSize';
import { thumbnailDimensions } from './thumbnailDimensions';

export const imageURL = (
  file: Partial<Pick<MinimalFile, 'id' | 'fileHash' | 'name' | 'type'>>,
  size: AllSize,
  extension?: string,
  // frame?: number,
) => {
  const { id, fileHash, name, type } = file;

  const path = `/image/${id}/${size}/${fileHash}/`;
  if (type == 'Video' && size != 'raw') return path + `joined.jpg`;
  console.log(name);

  return path + (extension ? name : name);
};

export const imageDimensions = (file: MinimalFile, size: ThumbnailSize) => {
  const { imageRatio } = file;
  const long = thumbnailDimensions[size];
  return { width: long, height: (long / (imageRatio ?? 1)).toFixed(0) };
};
