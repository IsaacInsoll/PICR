import File from '../models/File';
import sharp from 'sharp';
import { MetadataSummary } from '../types/MetadataSummary';
import { default as ex } from 'exif-reader';

export const getImageMetadata = async (file: File) => {
  try {
    const { exif, width, height } = await sharp(file.fullPath()).metadata();
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
      // ShutterSpeed:
      //   et > 0
      //     ? et < 1
      //       ? '1/' + (1 / x?.Photo.ExposureTime).toString() + ' sec'
      //       : et.toFixed(2) + 'sec'
      //     : '',
      ISO: x?.Photo?.ISOSpeedRatings,
    };
    return result;
  } catch (e) {
    console.log('Error getting metadata for file: ' + file.fullPath());
    console.log(e);
    return null;
  }
  /* {
[js]   Image: {
[js]     Make: 'FUJIFILM',
[js]     Model: 'X-H2',
[js]     Software: 'Adobe Photoshop Lightroom Classic 12.3 (Windows)',
[js]     DateTime: 2023-07-03T18:33:15.000Z,
[js]     Artist: 'Isaac Insoll',
[js]   },
[js]   Photo: {
[js]     ExposureTime: 0.00037037037037037035, (1/2700 sec according to windows so do 1/thisnumber
[js]     FNumber: 1.2,
[js]     ISOSpeedRatings: 125,
[js]     DateTimeOriginal: 2023-07-01T11:13:14.000Z,
[js]     OffsetTimeOriginal: '+10:00',
[js]     ShutterSpeedValue: 11.398744,
[js]     ApertureValue: 0.526069,
[js]     FocalLength: 56,
[js]     FocalLengthIn35mmFilm: 84,
[js]     LensMake: 'FUJIFILM',
[js]     LensModel: 'XF56mmF1.2 R WR',
[js]   }
*/
};
