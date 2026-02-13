import {
  File,
  ImageMetadataSummary,
  VideoMetadataSummary,
} from '@/gql/graphql';
import { formatMetadataValue } from './formatMetadataValue';
import { toReadableFraction } from 'readable-fractions';

export type AnyMetadataKey =
  | keyof ImageMetadataSummary
  | keyof VideoMetadataSummary;
export const metadataDescription: Record<
  keyof ImageMetadataSummary | keyof VideoMetadataSummary,
  string
> = {
  ExposureTime: 'Shutter Speed',
  DateTimeEdit: 'Last Edited',
  DateTimeOriginal: 'Created',
};

export interface MetadataPresentationResult {
  description: string;
  label: string;
  subLabel?: string;
  icon?: string;
  data?: unknown; //if it's something that needs bespoke custom rendering
}
export const metadataForPresentation = (
  file: File,
): MetadataPresentationResult[] => {
  const metadata = file.metadata;
  if (!metadata) return null;

  const keys: AnyMetadataKey[] = Object.keys(metadata).filter(
    (x) => !!metadata[x],
  );

  const list: MetadataPresentationResult[] = keys.map((k) => ({
    icon: k,
    description: metadataDescription[k] ?? k,
    label: formatMetadataValue(k, metadata[k]).label,
  }));

  const remove: AnyMetadataKey[] = [];

  if (metadata.VideoCodec && metadata.VideoCodecDescription) {
    remove.push('VideoCodec', 'VideoCodecDescription');
    list.push({
      description: 'Video',
      label: metadata.VideoCodec,
      subLabel: metadata.VideoCodecDescription,
    });
  }
  if (metadata.AudioCodec && metadata.AudioCodecDescription) {
    remove.push('AudioCodec', 'AudioCodecDescription');
    list.push({
      description: 'Audio',
      label: metadata.AudioCodec,
      subLabel: metadata.AudioCodecDescription,
    });
  }

  if (file.imageRatio) {
    list.push({
      icon: 'AspectRatio',
      description: 'Aspect Ratio',
      label: formattedAspectRatio(file),
      data: file.imageRatio,
    });
  }

  if (metadata.Width && metadata.Height) {
    remove.push('Width', 'Height');
    list.push({
      icon: 'AspectRatio',
      description: 'Dimensions',
      label: metadata.Width + ' x ' + metadata.Height + ' px',
    });
  }

  if (metadata.Rating) {
    remove.push('Rating');
    list.push({
      icon: 'Rating',
      description: 'Original Rating',
      label: metadata.Rating,
    });
  }

  console.log(list.map((x) => x.description));
  console.log(remove);
  const filtered = list.filter(
    ({ description }) => !remove.includes(description),
  );

  return filtered;
};

export const formattedAspectRatio = (file: File): string | null => {
  const ratio = file.imageRatio;
  if (!ratio) return null;
  const { denominator, numerator } = toReadableFraction(ratio);
  return `${numerator}/${denominator}`;
};
