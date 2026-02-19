import { formatMetadataValue } from './formatMetadataValue';
import { toReadableFraction } from 'readable-fractions';

export type AnyMetadataKey = string;

export const metadataDescription: Partial<Record<AnyMetadataKey, string>> = {
  ExposureTime: 'Shutter Speed',
  DateTimeEdit: 'Last Edited',
  DateTimeOriginal: 'Created',
};

export interface MetadataPresentationResult {
  description: string;
  label: string;
  subLabel?: string;
  icon?: string;
  data?: unknown; // if it's something that needs bespoke custom rendering
}

type MetadataObject = Record<string, string | number | null | undefined>;

type MetadataFile = {
  metadata?: MetadataObject | null;
  imageRatio?: number | null;
};

export const metadataForPresentation = (
  file: MetadataFile,
): MetadataPresentationResult[] => {
  const metadata = file.metadata;
  if (!metadata) return [];

  const keys = Object.keys(metadata).filter((key) => !!metadata[key]);

  const list: MetadataPresentationResult[] = keys.map((key) => ({
    icon: key,
    description: metadataDescription[key] ?? key,
    label: formatMetadataValue(key, metadata[key] as string | number).label,
  }));

  const remove: string[] = [];

  if (metadata.VideoCodec && metadata.VideoCodecDescription) {
    remove.push('VideoCodec', 'VideoCodecDescription');
    list.push({
      description: 'Video',
      label: String(metadata.VideoCodec),
      subLabel: String(metadata.VideoCodecDescription),
    });
  }
  if (metadata.AudioCodec && metadata.AudioCodecDescription) {
    remove.push('AudioCodec', 'AudioCodecDescription');
    list.push({
      description: 'Audio',
      label: String(metadata.AudioCodec),
      subLabel: String(metadata.AudioCodecDescription),
    });
  }

  if (typeof file.imageRatio === 'number' && file.imageRatio > 0) {
    list.push({
      icon: 'AspectRatio',
      description: 'Aspect Ratio',
      label: formattedAspectRatio(file.imageRatio),
      data: file.imageRatio,
    });
  }

  if (metadata.Width && metadata.Height) {
    remove.push('Width', 'Height');
    list.push({
      icon: 'AspectRatio',
      description: 'Dimensions',
      label: `${metadata.Width} x ${metadata.Height} px`,
    });
  }

  if (metadata.Rating) {
    remove.push('Rating');
    list.push({
      icon: 'Rating',
      description: 'Original Rating',
      label: String(metadata.Rating),
    });
  }

  const filtered = list.filter(
    ({ description }) => !remove.includes(description),
  );
  return filtered;
};

export const formattedAspectRatio = (ratio: number): string => {
  const { denominator, numerator } = toReadableFraction(ratio);
  return `${numerator}/${denominator}`;
};
