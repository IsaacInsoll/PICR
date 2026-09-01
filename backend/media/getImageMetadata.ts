import type { PicrImageMetadata } from '@shared/types/metadata.js';
import { default as ex } from 'exif-reader';
import { XMLParser } from 'fast-xml-parser';
import type { Metadata } from 'sharp';
import type { FileFields } from '../db/picrDb.js';
import { openSharp } from './openSharp.js';
import { fullPathForFile } from '../filesystem/fileManager.js';
import { log } from '../logger.js';
import {
  imageRatioForDimensions,
  orientedImageDimensionsFromMetadata,
  type ImageDimensions,
} from './imageDimensions.js';

export interface ImageMetadataAndDimensions {
  dimensions: ImageDimensions;
  imageRatio: number;
  metadata: PicrImageMetadata;
}

export const getImageMetadataAndDimensions = async (
  file: Pick<FileFields, 'name' | 'relativePath'>,
  src?: string,
): Promise<ImageMetadataAndDimensions> => {
  const path = src ?? fullPathForFile(file);
  const sharpMetadata = await openSharp(path).metadata();
  const dimensions = orientedImageDimensionsFromMetadata(sharpMetadata);

  return {
    dimensions,
    imageRatio: imageRatioForDimensions(dimensions),
    metadata: imageMetadataSummary(sharpMetadata, dimensions),
  };
};

const imageMetadataSummary = (
  metadata: Metadata,
  dimensions: ImageDimensions,
): PicrImageMetadata => {
  const result: PicrImageMetadata = {
    Width: dimensions.width,
    Height: dimensions.height,
    Rating: getImageRating(metadata.xmp),
  };

  if (!metadata.exif) return result;

  try {
    const x = ex(metadata.exif);
    result.Camera = joinDefined(x.Image?.Make, x.Image?.Model);
    result.Lens = joinDefined(x.Photo?.LensMake, x.Photo?.LensModel);
    result.Artist = x.Image?.Artist;
    result.DateTimeEdit = toISODateTime(x.Image?.DateTime);
    result.DateTimeOriginal = toISODateTime(x.Photo?.DateTimeOriginal);
    result.Aperture = x.Photo?.FNumber;
    result.ExposureTime = x.Photo?.ExposureTime;
    result.ISO = x.Photo?.ISOSpeedRatings;
  } catch (error) {
    log('error', `Error parsing EXIF metadata: ${String(error)}`);
  }

  return result;
};

// Join optional string parts and return null instead of "undefined" when metadata is missing
const joinDefined = (
  ...values: Array<string | null | undefined>
): string | null => {
  const defined = values
    .map((v) => v?.trim())
    .filter((v): v is string => !!v && v.length > 0);
  return defined.length ? defined.join(' ') : null;
};

// We need attributes (not just child elements) to read lightroom rating)
const xmlParser = new XMLParser({
  attributeNamePrefix: '@_',
  ignoreAttributes: false,
});

// Get Lightroom rating (EG: '3 stars' from raw XMP Buffer)
const getImageRating = (xmp: Buffer | undefined): number => {
  if (!xmp) return 0;
  try {
    const xml = xmlParser.parse(xmp.toString());
    const rating = parseInt(
      xml['x:xmpmeta']['rdf:RDF']['rdf:Description']['@_xmp:Rating'],
      10,
    );
    return !isNaN(rating) ? rating : 0;
  } catch {
    // console.log('Error parsing XML metadata for: ' + file.name);
    // console.log(error);
    return 0;
  }
};

const toISODateTime = (value: unknown): string | null => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return null;
};
