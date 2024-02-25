import { AllSize } from '../../../src/helpers/thumbnailSizes';
import { MinimalFile } from '../../types';

export const imageURL = (file: MinimalFile, size: AllSize) => {
  const { id, fileHash } = file;
  return `/image/${id}/${size}/${fileHash}`;
};
