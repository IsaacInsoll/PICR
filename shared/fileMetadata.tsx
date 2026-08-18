import { formatMetadataValue } from './formatMetadataValue';
import { toReadableFraction } from 'readable-fractions';
import type { PicrMetadataMap } from './types/metadata.js';
import { formatNumber } from './i18n/formatting';

export type AnyMetadataKey = string;

export const metadataDescriptions = {
  Aperture: 'Aperture',
  Artist: 'Artist',
  AspectRatio: 'Aspect Ratio',
  Audio: 'Audio',
  Bitrate: 'Bitrate',
  Camera: 'Camera',
  DateTimeEdit: 'Last Edited',
  DateTimeOriginal: 'Photo taken',
  Dimensions: 'Dimensions',
  Duration: 'Duration',
  ExposureTime: 'Shutter Speed',
  Format: 'Format',
  Framerate: 'Framerate',
  ISO: 'ISO',
  Lens: 'Lens',
  OriginalRating: 'Original Rating',
  Video: 'Video',
} as const;

export type MetadataDescriptionKey = keyof typeof metadataDescriptions;
export type MetadataDescriptionTranslator = (
  key: MetadataDescriptionKey,
) => string;

const metadataDescriptionKeySet = new Set<string>(
  Object.keys(metadataDescriptions),
);

export const isMetadataDescriptionKey = (
  key: string,
): key is MetadataDescriptionKey => metadataDescriptionKeySet.has(key);

export const metadataDescription = (
  key: AnyMetadataKey,
  translate: MetadataDescriptionTranslator = (knownKey) =>
    metadataDescriptions[knownKey],
): string => (isMetadataDescriptionKey(key) ? translate(key) : key);

export interface MetadataPresentationResult {
  key: AnyMetadataKey;
  description: string;
  label: string;
  subLabel?: string;
  icon?: string;
  data?: unknown; // if it's something that needs bespoke custom rendering
}

type MetadataFile = {
  metadata?: PicrMetadataMap | null;
  imageRatio?: number | null;
};

export const metadataForPresentation = (
  file: MetadataFile,
  locale = 'en',
  translate?: MetadataDescriptionTranslator,
): MetadataPresentationResult[] => {
  const metadata = file.metadata;
  if (!metadata) return [];

  const keys = Object.keys(metadata).filter((key) => !!metadata[key]);

  const list: MetadataPresentationResult[] = keys.map((key) => ({
    key,
    icon: key,
    description: metadataDescription(key, translate),
    label: formatMetadataValue(key, metadata[key] as string | number, locale)
      .label,
  }));

  const remove: string[] = [];

  if (metadata['VideoCodec'] && metadata['VideoCodecDescription']) {
    remove.push('VideoCodec', 'VideoCodecDescription');
    list.push({
      key: 'Video',
      description: metadataDescription('Video', translate),
      label: String(metadata['VideoCodec']),
      subLabel: String(metadata['VideoCodecDescription']),
    });
  }
  if (metadata['AudioCodec'] && metadata['AudioCodecDescription']) {
    remove.push('AudioCodec', 'AudioCodecDescription');
    list.push({
      key: 'Audio',
      description: metadataDescription('Audio', translate),
      label: String(metadata['AudioCodec']),
      subLabel: String(metadata['AudioCodecDescription']),
    });
  }

  if (typeof file.imageRatio === 'number' && file.imageRatio > 0) {
    list.push({
      key: 'AspectRatio',
      icon: 'AspectRatio',
      description: metadataDescription('AspectRatio', translate),
      label: formattedAspectRatio(file.imageRatio),
      data: file.imageRatio,
    });
  }

  if (metadata['Width'] && metadata['Height']) {
    remove.push('Width', 'Height');
    list.push({
      key: 'Dimensions',
      icon: 'AspectRatio',
      description: metadataDescription('Dimensions', translate),
      // Pixel dimensions are a technical spec (6000 × 4000), so the numbers
      // are localized but never grouped.
      label: `${formatNumber(Number(metadata['Width']), locale, {
        useGrouping: false,
      })} × ${formatNumber(Number(metadata['Height']), locale, {
        useGrouping: false,
      })} px`,
    });
  }

  if (metadata['Rating']) {
    remove.push('Rating');
    list.push({
      key: 'OriginalRating',
      icon: 'Rating',
      description: metadataDescription('OriginalRating', translate),
      label: String(metadata['Rating']),
    });
  }

  const filtered = list.filter(({ key }) => !remove.includes(key));
  return filtered;
};

export const formattedAspectRatio = (ratio: number): string => {
  const { denominator, numerator } = toReadableFraction(ratio);
  return `${numerator}/${denominator}`;
};
