import { Image, ImageMetadataSummary } from '@shared/gql/graphql';

export type MetadataOptionsForFiltering = Partial<
  Record<keyof ImageMetadataSummary, (string | number)[]>
>;

export const metadataForFiltering = (
  files: Image[],
): MetadataOptionsForFiltering => {
  const metas = files.map((f) => f.metadata);
  const unique = (key: keyof ImageMetadataSummary): (string | number)[] => {
    const values = metas.map((metadata) => metadata?.[key]);
    return [...new Set(values)].filter(
      (value): value is string | number =>
        value !== null && value !== undefined && value !== '',
    );
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
