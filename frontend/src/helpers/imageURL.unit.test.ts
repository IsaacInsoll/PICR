import { FileType } from '@shared/gql/graphql';
import { describe, expect, test } from 'vitest';
import { imageURL } from './imageURL';
import { thumbnailSrcSet } from './thumbnailVariantImages';

const image = {
  id: '42',
  fileHash: 'image-hash',
  name: 'Annun taidetta-001.jpg',
  type: FileType.Image,
  imageWidth: 1200,
  imageHeight: 800,
};

describe('imageURL', () => {
  test('encodes filenames so spaces do not terminate srcset URLs', () => {
    expect(imageURL(image, 'v1-750j80')).toBe(
      '/image/42/v1-750j80/image-hash/Annun%20taidetta-001.jpg',
    );

    expect(
      thumbnailSrcSet(image, [
        {
          token: 'v1-500j80',
          width: 500,
          format: 'jpeg',
          mimeType: 'image/jpeg',
          quality: 80,
        },
        {
          token: 'v1-750j80',
          width: 750,
          format: 'jpeg',
          mimeType: 'image/jpeg',
          quality: 80,
        },
      ]),
    ).toBe(
      '/image/42/v1-500j80/image-hash/Annun%20taidetta-001.jpg 500w, /image/42/v1-750j80/image-hash/Annun%20taidetta-001.jpg 750w',
    );
  });

  test('encodes filename characters that have URL or srcset meaning', () => {
    expect(
      imageURL(
        { ...image, name: 'Portrait, 100% #1? final/print.jpg' },
        'v1-1000j80',
      ),
    ).toBe(
      '/image/42/v1-1000j80/image-hash/Portrait%2C%20100%25%20%231%3F%20final%2Fprint.jpg',
    );
  });

  test('encodes an explicitly appended extension as part of the filename', () => {
    expect(imageURL({ ...image, name: 'edited preview' }, 'raw', '.jpg')).toBe(
      '/image/42/raw/image-hash/edited%20preview.jpg',
    );
  });

  test('keeps the fixed video poster filename unchanged', () => {
    expect(imageURL({ ...image, type: FileType.Video }, 'v1-750j80')).toBe(
      '/image/42/v1-750j80/image-hash/poster.jpg',
    );
  });
});
