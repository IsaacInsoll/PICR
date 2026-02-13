import sharp from 'sharp';
import { MetadataSummary } from '../types/MetadataSummary.js';
import { default as ex } from 'exif-reader';
import { XMLParser } from 'fast-xml-parser';
import { fullPathForFile } from '../filesystem/fileManager.js';
import { FileFields } from '../db/picrDb.js';

export const getImageMetadata = async (file: FileFields) => {
  try {
    const { exif, width, height, xmp } = await sharp(
      fullPathForFile(file),
    ).metadata();

    if (!exif) return null;
    const x = ex(exif);
    const camera = joinDefined(x?.Image?.Make, x?.Image?.Model);
    const lens = joinDefined(x?.Photo?.LensMake, x?.Photo?.LensModel);
    // const et = x?.Photo?.ExposureTime;
    const result: MetadataSummary = {
      Camera: camera,
      Lens: lens,
      Artist: x?.Image?.Artist,
      DateTimeEdit: x?.Image?.DateTime,
      DateTimeOriginal: x?.Photo?.DateTimeOriginal,
      Aperture: x?.Photo?.FNumber,
      ExposureTime: x?.Photo?.ExposureTime,
      Width: width,
      Height: height,
      ISO: x?.Photo?.ISOSpeedRatings,
      Rating: getImageRating(xmp),
    };
    return result;
  } catch (e) {
    console.log('Error getting metadata for file: ' + fullPathForFile(file));
    console.log(e);
    return null;
  }
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
    );
    return !isNaN(rating) ? rating : 0;
  } catch {
    // console.log('Error parsing XML metadata for: ' + file.name);
    // console.log(error);
    return 0;
  }
};
