import { gql } from '../../../frontend/src/helpers/gql';

export const heroImageFragment = gql(/* GraphQL */ `
  fragment HeroImageFragment on Folder {
    heroImage {
      id
      name
      fileHash
      imageRatio
      blurHash
    }
  }
`);
