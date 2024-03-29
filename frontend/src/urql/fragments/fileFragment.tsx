import { gql } from '../../helpers/gql';

export const fileFragment = gql(/* GraphQL */ `
  fragment FileFragment on File {
    id
    name
    type
    imageRatio
    fileHash
    fileSize
  }
`);
