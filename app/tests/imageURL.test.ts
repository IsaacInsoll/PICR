import { describe, expect, it } from '@jest/globals';
import { FileType } from '@shared/gql/graphql';
import { imageURL } from '@/src/helpers/imageURL';

const image = {
  id: '42',
  fileHash: 'hash',
  name: 'client #1/100% ready?.jpg',
  type: FileType.Image,
};

describe('imageURL', () => {
  it('uses the server-published thumbnail token and encodes the filename', () => {
    expect(imageURL(image, 'v1-1000j80')).toBe(
      'image/42/v1-1000j80/hash/client%20%231%2F100%25%20ready%3F.jpg',
    );
  });

  it('encodes raw image and video filenames', () => {
    expect(imageURL(image, 'raw')).toBe(
      'image/42/raw/hash/client%20%231%2F100%25%20ready%3F.jpg',
    );
    expect(
      imageURL({ ...image, name: 'clip #1.mp4', type: FileType.Video }, 'raw'),
    ).toBe('image/42/raw/hash/clip%20%231.mp4');
  });

  it('keeps the fixed video poster filename', () => {
    expect(
      imageURL(
        { ...image, name: 'clip #1.mp4', type: FileType.Video },
        'v1-500j80',
      ),
    ).toBe('image/42/v1-500j80/hash/poster.jpg');
  });

  it('encodes derived image filenames after adding their extension', () => {
    expect(imageURL(image, 'v1-250j80', '.preview.jpg')).toBe(
      'image/42/v1-250j80/hash/client%20%231%2F100%25%20ready%3F.jpg.preview.jpg',
    );
  });
});
