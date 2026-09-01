export const THUMBNAIL_VARIANT_CACHE_VERSION = 'v1';
export const THUMBNAIL_JPEG_QUALITY = 80;

export const thumbnailVariantWidths = [
  250, 500, 750, 1000, 1500, 2048, 2560, 4000,
] as const;

export type ThumbnailVariantWidth = (typeof thumbnailVariantWidths)[number];

export type ThumbnailGenerationPolicy = 'eager' | 'on-demand' | 'disabled';

interface ThumbnailVariantFormatConfig {
  format: string;
  letter: string;
  extension: string;
  mimeType: string;
  generationPolicy: ThumbnailGenerationPolicy;
  enabled: boolean;
  defaultQuality: number;
  qualitySetting: keyof ThumbnailVariantQualitySettings;
}

export interface ThumbnailVariantQualitySettings {
  thumbnailJpegQuality: number;
}

const defineThumbnailVariantFormats = <
  const Formats extends Record<string, ThumbnailVariantFormatConfig>,
>(
  formats: Formats,
): Formats => formats;

export const thumbnailVariantFormats = defineThumbnailVariantFormats({
  jpeg: {
    format: 'jpeg',
    letter: 'j',
    extension: '.jpg',
    mimeType: 'image/jpeg',
    // Keep these widened so the eager/enabled filters stay meaningful while
    // there is only one concrete format in the registry.
    generationPolicy: 'eager' as ThumbnailGenerationPolicy,
    enabled: true as boolean,
    defaultQuality: THUMBNAIL_JPEG_QUALITY,
    qualitySetting: 'thumbnailJpegQuality',
  },
});

export type ThumbnailVariantFormat = keyof typeof thumbnailVariantFormats;
export type ThumbnailVariantFormatDefinition =
  (typeof thumbnailVariantFormats)[ThumbnailVariantFormat];
export type ThumbnailVariantFormatLetter =
  ThumbnailVariantFormatDefinition['letter'];
export type ThumbnailVariantExtension =
  ThumbnailVariantFormatDefinition['extension'];

export interface ThumbnailVariant {
  token: ThumbnailVariantToken;
  cacheVersion: typeof THUMBNAIL_VARIANT_CACHE_VERSION;
  width: ThumbnailVariantWidth;
  format: ThumbnailVariantFormat;
  letter: ThumbnailVariantFormatLetter;
  extension: ThumbnailVariantExtension;
  mimeType: ThumbnailVariantFormatDefinition['mimeType'];
  quality: number;
  generationPolicy: ThumbnailGenerationPolicy;
}

export type ThumbnailVariantToken =
  `${typeof THUMBNAIL_VARIANT_CACHE_VERSION}-${ThumbnailVariantWidth}${ThumbnailVariantFormatLetter}${number}`;

export interface ParsedThumbnailVariantToken {
  cacheVersion: string;
  width: number;
  letter: string;
  quality: number;
}

export const thumbnailVariantToken = (
  width: ThumbnailVariantWidth,
  quality: number,
  format: ThumbnailVariantFormat = 'jpeg',
): ThumbnailVariantToken => {
  assertThumbnailVariantQuality(quality);
  const formatConfig = thumbnailVariantFormats[format];
  return `${THUMBNAIL_VARIANT_CACHE_VERSION}-${width}${formatConfig.letter}${quality}`;
};

export const thumbnailVariantLadderForSettings = (
  settings: ThumbnailVariantQualitySettings,
): readonly ThumbnailVariant[] =>
  thumbnailVariantWidths.flatMap((width) =>
    thumbnailVariantFormatList
      .filter((format) => format.enabled && format.generationPolicy === 'eager')
      .map((format) =>
        createThumbnailVariant(
          width,
          thumbnailVariantQualityForSettings(format, settings),
          format,
        ),
      ),
  );

export const thumbnailVariantForWidth = (
  width: ThumbnailVariantWidth,
  quality: number = thumbnailVariantFormats.jpeg.defaultQuality,
  format: ThumbnailVariantFormat = 'jpeg',
): ThumbnailVariant => {
  assertThumbnailVariantQuality(quality);
  const formatConfig = thumbnailVariantFormats[format];
  return createThumbnailVariant(width, quality, formatConfig);
};

export const thumbnailVariantFormatList: readonly ThumbnailVariantFormatDefinition[] =
  Object.values(thumbnailVariantFormats);

export const thumbnailVariantFormatForLetter = (
  letter: string,
): ThumbnailVariantFormatDefinition | null =>
  thumbnailVariantFormatList.find((format) => format.letter === letter) ?? null;

export const thumbnailVariantQualityForSettings = (
  format: ThumbnailVariantFormatDefinition,
  settings: ThumbnailVariantQualitySettings,
): number => {
  const quality = settings[format.qualitySetting];
  assertThumbnailVariantQuality(quality);
  return quality;
};

const createThumbnailVariant = (
  width: ThumbnailVariantWidth,
  quality: number,
  format: ThumbnailVariantFormatDefinition,
): ThumbnailVariant => {
  return {
    token: thumbnailVariantToken(width, quality, format.format),
    cacheVersion: THUMBNAIL_VARIANT_CACHE_VERSION,
    width,
    format: format.format,
    letter: format.letter,
    extension: format.extension,
    mimeType: format.mimeType,
    quality,
    generationPolicy: format.generationPolicy,
  };
};

export const parseThumbnailVariantToken = (
  token: string,
): ParsedThumbnailVariantToken | null => {
  const match = token.match(/^([a-z][a-z0-9]*)-(\d+)([a-z])(\d+)$/);
  if (!match) return null;

  const width = Number(match[2]);
  const quality = Number(match[4]);
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(quality)) {
    return null;
  }

  return {
    cacheVersion: match[1],
    width,
    letter: match[3],
    quality,
  };
};

export const thumbnailVariantForToken = (
  token: string,
): ThumbnailVariant | null => {
  const parsed = parseThumbnailVariantToken(token);
  if (!parsed) return null;
  if (parsed.cacheVersion !== THUMBNAIL_VARIANT_CACHE_VERSION) return null;
  const format = thumbnailVariantFormatForLetter(parsed.letter);
  if (!format) return null;
  if (!isThumbnailVariantWidth(parsed.width)) return null;
  if (!isThumbnailVariantQuality(parsed.quality)) return null;
  const canonicalToken = thumbnailVariantToken(
    parsed.width,
    parsed.quality,
    format.format,
  );
  if (canonicalToken !== token) return null;

  return createThumbnailVariant(parsed.width, parsed.quality, format);
};

export const isThumbnailVariantWidth = (
  width: number,
): width is ThumbnailVariantWidth =>
  thumbnailVariantWidths.includes(width as ThumbnailVariantWidth);

export const isThumbnailVariantQuality = (quality: number): boolean =>
  Number.isInteger(quality) && quality >= 1 && quality <= 100;

export const assertThumbnailVariantQuality = (quality: number): void => {
  if (!isThumbnailVariantQuality(quality)) {
    throw new Error('Thumbnail quality must be between 1 and 100');
  }
};
