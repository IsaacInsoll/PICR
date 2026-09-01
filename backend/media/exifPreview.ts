import { default as exifReader } from 'exif-reader';
import { openSharp } from './openSharp.js';

interface ExifWithThumbnail {
  Thumbnail?: {
    Compression?: number;
    JPEGInterchangeFormat?: number;
    JPEGInterchangeFormatLength?: number;
  };
}

type ExifReader = (exif: Buffer) => unknown;

const jpegCompression = 6;
const exifTiffHeaderOffset = 6;
const maxAspectRatioDifference = 0.02;
const unrotatedOrientation = 1;

export const embeddedExifJpegPreviewForImage = async (
  path: string,
  options?: { readExif?: ExifReader },
): Promise<Buffer | null> => {
  try {
    const { exif, height, orientation, width } =
      await openSharp(path).metadata();
    if (!exif || !width || !height) return null;
    // An extracted IFD1 preview is a bare JPEG stream with no EXIF of its own,
    // so `.rotate()` is a no-op on it while it does rotate the full source.
    // Rejecting rotated sources keeps both blurhash paths in agreement instead
    // of making the result depend on whether a preview happened to exist.
    if (orientation !== undefined && orientation !== unrotatedOrientation) {
      return null;
    }

    const preview = extractExifJpegPreview(exif, options?.readExif);
    if (!preview) return null;

    const previewMetadata = await openSharp(preview).metadata();
    if (
      !previewMetadata.width ||
      !previewMetadata.height ||
      !aspectRatiosMatch(
        width,
        height,
        previewMetadata.width,
        previewMetadata.height,
      )
    ) {
      return null;
    }

    return preview;
  } catch {
    return null;
  }
};

export const extractExifJpegPreview = (
  exif: Buffer,
  readExif: ExifReader = exifReader,
): Buffer | null => {
  try {
    const parsed = readExif(exif) as ExifWithThumbnail;
    const compression = parsed.Thumbnail?.Compression;
    const offset = parsed.Thumbnail?.JPEGInterchangeFormat;
    const length = parsed.Thumbnail?.JPEGInterchangeFormatLength;
    if (
      compression !== jpegCompression ||
      typeof offset !== 'number' ||
      typeof length !== 'number' ||
      length <= 0 ||
      offset < 0
    ) {
      return null;
    }

    return previewSlice(exif, offset + exifTiffHeaderOffset, length);
  } catch {
    return null;
  }
};

const previewSlice = (
  exif: Buffer,
  offset: number,
  length: number,
): Buffer | null => {
  if (offset < 0 || offset + length > exif.length) return null;
  const preview = exif.subarray(offset, offset + length);
  return isJpeg(preview) ? preview : null;
};

const isJpeg = (buffer: Buffer) =>
  buffer.length >= 4 &&
  buffer[0] === 0xff &&
  buffer[1] === 0xd8 &&
  buffer[buffer.length - 2] === 0xff &&
  buffer[buffer.length - 1] === 0xd9;

const aspectRatiosMatch = (
  sourceWidth: number,
  sourceHeight: number,
  previewWidth: number,
  previewHeight: number,
) => {
  const sourceRatio = sourceWidth / sourceHeight;
  const previewRatio = previewWidth / previewHeight;
  return (
    Math.abs(sourceRatio - previewRatio) / sourceRatio <=
    maxAspectRatioDifference
  );
};
