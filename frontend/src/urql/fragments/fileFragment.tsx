import { gql } from '../../helpers/gql';

export const fileFragment = gql(/* GraphQL */ `
  fragment FileFragment on FileInterface {
    __typename
    id
    name
    type
    fileHash
    fileSize
    fileLastModified
    flag
    rating
    totalComments
    latestComment
    folderId
    ... on Video {
      imageRatio
      duration
      ...VideoMetadataFragment
    }
    ... on Image {
      imageRatio
      blurHash
      ...ImageMetadataFragment
    }
  }
`);
