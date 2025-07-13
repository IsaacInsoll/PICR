import {gql} from "../gql.js";

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
