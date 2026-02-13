import sharp from 'sharp';
import { encode } from 'blurhash';
import { log } from '../logger.js';

export async function encodeImageToBlurhash(path: string): Promise<string> {
  try {
    const { data, info } = await sharp(path)
      .raw()
      .ensureAlpha()
      .resize(32, 32, { fit: 'inside' })
      .toBuffer({ resolveWithObject: true }); // returns { data, info }

    return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    log(
      'error',
      `Failed to create blurhash for "${path}": ${message}`,
    );
    return '';
  }
}
