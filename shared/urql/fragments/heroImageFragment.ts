import {gql} from "../gql";

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
