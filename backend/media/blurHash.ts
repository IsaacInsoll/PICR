import { encode } from 'blurhash';
import { log } from '../logger.js';
import { embeddedExifJpegPreviewForImage } from './exifPreview.js';
import { openSharp, type SharpInput } from './openSharp.js';

export async function encodeImageToBlurhash(path: string): Promise<string> {
  try {
    const preview = await embeddedExifJpegPreviewForImage(path);
    if (preview) {
      const previewHash = await tryEncodeBlurhashFromInput(preview);
      if (previewHash) return previewHash;
    }

    return await encodeBlurhashFromInput(path);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    log('error', `Failed to create blurhash for "${path}": ${message}`);
    return '';
  }
}

const tryEncodeBlurhashFromInput = async (
  input: SharpInput,
): Promise<string | null> => {
  try {
    return await encodeBlurhashFromInput(input);
  } catch {
    return null;
  }
};

// `.rotate()` auto-orients from EXIF so the placeholder matches the pre-rotated
// thumbnail and the oriented `imageRatio` it is drawn into. It is a no-op for
// EXIF previews (they carry no EXIF), which is why `exifPreview.ts` refuses
// previews from rotated sources and sends them down this path instead.
const encodeBlurhashFromInput = async (input: SharpInput): Promise<string> => {
  const { data, info } = await openSharp(input)
    .rotate()
    .raw()
    .ensureAlpha()
    .resize(32, 32, { fit: 'inside' })
    .toBuffer({ resolveWithObject: true }); // returns { data, info }

  return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4);
};
