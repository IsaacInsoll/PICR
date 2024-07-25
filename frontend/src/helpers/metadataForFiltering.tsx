import { MinimalFile } from '../../types';
import { uniq } from 'lodash';
import { MetadataSummary } from '../gql/graphql';

export type MetadataOptionsForFiltering = Partial<
  Record<keyof MetadataSummary, (string | number)[]>
>;

export const metadataForFiltering = (
  files: MinimalFile[],
): MetadataOptionsForFiltering => {
  const metas = files.map((f) => f.metadata);
  const unique = (key: keyof MetadataSummary): (string | number)[] => {
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
