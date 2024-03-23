import { MinimalFile } from '../../types';
import { AllSize, ThumbnailSize } from './thumbnailSize';
import { thumbnailDimensions } from './thumbnailDimensions';

export const imageURL = (file: MinimalFile, size: AllSize) => {
  const { id, fileHash, name } = file;
  return `/image/${id}/${size}/${fileHash}/${name}`;
};

export const imageDimensions = (file: MinimalFile, size: ThumbnailSize) => {
  const { imageRatio } = file;
  const long = thumbnailDimensions[size];
  return { width: long, height: (long / (imageRatio ?? 1)).toFixed(0) };
};
