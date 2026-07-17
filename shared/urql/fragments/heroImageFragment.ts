import { gql } from '../gql';

// The folder's thumbnail/cover image. Banner fields live in
// FolderBannerFragment - they are not interchangeable, and this fragment used
// to hand out bannerImage without the layout fields that make it renderable.
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
