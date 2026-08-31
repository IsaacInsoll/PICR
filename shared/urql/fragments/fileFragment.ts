import { gql } from '../gql';

export const fileFragment = gql(/* GraphQL */ `
  fragment FileFragment on FileInterface {
    __typename
    id
    name
    type
    fileHash
    fileSize
    fileCreated
    fileLastModified
    flag
    rating
    totalComments
    latestComment
    folderId
    ... on Video {
      imageRatio
      blurHash
      duration
      ...VideoMetadataFragment
    }
    ... on Image {
      imageWidth
      imageHeight
      imageRatio
      blurHash
      ...ImageMetadataFragment
    }
  }
`);
