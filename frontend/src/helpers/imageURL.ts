import { MinimalFile } from '../../types';
import { AllSize, ThumbnailSize } from './thumbnailSize';
import { thumbnailDimensions } from './thumbnailDimensions';

export const imageURL = (file: MinimalFile, size: AllSize, frame?: number) => {
  const { id, fileHash, name, type } = file;
  const path = `/image/${id}/${size}/${fileHash}/`;
  if (type == 'Video' && size != 'raw')
    return path + `${size}_${frame ?? 2}.jpg`;
  return path + name;
};

export const imageDimensions = (file: MinimalFile, size: ThumbnailSize) => {
  const { imageRatio } = file;
  const long = thumbnailDimensions[size];
  return { width: long, height: (long / (imageRatio ?? 1)).toFixed(0) };
};
