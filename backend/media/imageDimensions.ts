import type { Metadata } from 'sharp';
import { openSharp } from './openSharp.js';

export interface ImageDimensions {
  width: number;
  height: number;
}

export const getOrientedImageDimensions = async (
  filePath: string,
): Promise<ImageDimensions> =>
  orientedImageDimensionsFromMetadata(await openSharp(filePath).metadata());

export const orientedImageDimensionsFromMetadata = (
  metadata: Pick<Metadata, 'width' | 'height' | 'orientation'>,
): ImageDimensions => {
  const { width, height } = metadata;
  if (!width || !height) {
    throw new Error('image metadata had no dimensions');
  }

  return swapsDimensions(metadata.orientation)
    ? { width: height, height: width }
    : { width, height };
};

export const imageRatioForDimensions = ({
  width,
  height,
}: ImageDimensions): number => width / height;

const swapsDimensions = (orientation: number | undefined): boolean =>
  orientation !== undefined && orientation >= 5 && orientation <= 8;
