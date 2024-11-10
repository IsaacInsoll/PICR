import { gql } from '../../helpers/gql';

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
