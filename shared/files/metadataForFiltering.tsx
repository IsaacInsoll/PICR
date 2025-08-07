import {uniq} from 'lodash';
import {Image, ImageMetadataSummary} from '@/gql/graphql';

export type MetadataOptionsForFiltering = Partial<
  Record<keyof ImageMetadataSummary, (string | number)[]>
>;

export const metadataForFiltering = (
  files: Image[],
): MetadataOptionsForFiltering => {
  const metas = files.map((f) => f.metadata);
  const unique = (key: keyof ImageMetadataSummary): (string | number)[] => {
    const m = metas.map((i) => i?.[key]);
    return uniq(m).filter((x): x is string | number => !!x);
  };

  // console.log('metadataForFiltering() for  ' + files.length + ' files');
  return {
    Camera: unique('Camera'),
    Lens: unique('Lens'),
    Aperture: unique('Aperture'),
    ExposureTime: unique('ExposureTime'),
    ISO: unique('ISO'),
  };
};
