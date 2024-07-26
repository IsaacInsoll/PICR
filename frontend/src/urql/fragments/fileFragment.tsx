import { gql } from '../../helpers/gql';

export const fileFragment = gql(/* GraphQL */ `
  fragment FileFragment on FileInterface {
    __typename
    id
    name
    type
    fileHash
    fileSize
    ... on Video {
      imageRatio
      duration
    }
    ... on Image {
      imageRatio
      ...ImageMetadataFragment
    }
  }
`);
