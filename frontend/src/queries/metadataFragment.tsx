import { gql } from '../helpers/gql';

export const metadataFragment = gql(/* GraphQL */ `
  fragment MetadataFragment on MetadataSummary {
    Camera
    Lens
    Artist
    DateTimeOriginal
    DateTimeEdit
    Aperture
    ExposureTime
    ISO
  }
`);
