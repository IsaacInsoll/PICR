import sharp from 'sharp';
import { encode } from 'blurhash';

//from https://github.com/woltapp/blurhash/issues/43#issuecomment-597674435
export const encodeImageToBlurhash: Promise<string> = (path) =>
  new Promise((resolve, reject) => {
    sharp(path)
      .raw()
      .ensureAlpha()
      .resize(32, 32, { fit: 'inside' })
      .toBuffer((err, buffer, { width, height }) => {
        if (err) return reject(err);
        resolve(encode(new Uint8ClampedArray(buffer), width, height, 4, 4));
      });
  });
