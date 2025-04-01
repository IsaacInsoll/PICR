import sharp from 'sharp';
import { MetadataSummary } from '../types/MetadataSummary';
import { default as ex } from 'exif-reader';
import { XMLParser } from 'fast-xml-parser';
import { fullPathForFile } from '../filesystem/fileManager';
import { FileFields } from '../db/picrDb';

export const getImageMetadata = async (file: FileFields) => {
  try {
    const { exif, width, height, xmp } = await sharp(
      fullPathForFile(file),
    ).metadata();

    if(!exif) return null;
    const x = ex(exif);
    // const et = x?.Photo?.ExposureTime;
    const result: MetadataSummary = {
      Camera: `${x?.Image?.Make} ${x?.Image?.Model}`,
      Lens: `${x?.Photo?.LensMake} ${x?.Photo?.LensModel}`,
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

// We need attributes (not just child elements) to read lightroom rating)
const xmlParser = new XMLParser({
  attributeNamePrefix: '@_',
  ignoreAttributes: false,
});

// Get Lightroom rating (EG: '3 stars' from raw XMP Buffer)
const getImageRating = (xmp: Buffer|undefined): number => {
  if(!xmp) return 0;
  try {
    const xml = xmlParser.parse(xmp.toString());
    const rating = parseInt(
      xml['x:xmpmeta']['rdf:RDF']['rdf:Description']['@_xmp:Rating'],
    );
    return !isNaN(rating) ? rating : 0;
  } catch (error) {
    // console.log('Error parsing XML metadata for: ' + file.name);
    // console.log(error);
    return 0;
  }
};
