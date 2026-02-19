import { gql } from '../gql';

export const heroImageFragment = gql(/* GraphQL */ `
  fragment HeroImageFragment on Folder {
    heroImage {
      __typename
      id
      name
      fileHash
      imageRatio
      blurHash
      type
    }
  }
`);
