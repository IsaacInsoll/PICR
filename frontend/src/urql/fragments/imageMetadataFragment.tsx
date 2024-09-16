import { gql } from '../../helpers/gql';

const imageMetadataFragment = gql(/* GraphQL */ `
  fragment ImageMetadataFragment on Image {
    ... on Image {
      metadata {
        Camera
        Lens
        Artist
        DateTimeOriginal
        DateTimeEdit
        Aperture
        ExposureTime
        ISO
        Width
        Height
        Rating
      }
    }
  }
`);
