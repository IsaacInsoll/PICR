import { gql } from '../gql';

export const thumbnailVariantFragment = gql(/* GraphQL */ `
  fragment ThumbnailVariantFragment on ThumbnailVariant {
    token
    width
    format
    mimeType
    quality
  }
`);
