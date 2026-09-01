import { gql } from '../gql';

// Everything needed to RENDER a banner, kept together deliberately.
//
// bannerSize/bannerTextHAlign/bannerTextVAlign must be impossible to select
// apart from bannerImage: `bannerSize: null` legitimately means "classic" (the
// default) AND is what graphcache returns for a schema-aware partial hit, so a
// reader cannot tell "this folder uses the default size" from "we never cached
// the size". Selecting bannerImage without them would render a banner at a
// guessed height and shift when the real query lands.
export const folderBannerFragment = gql(/* GraphQL */ `
  fragment FolderBannerFragment on Folder {
    bannerImage {
      __typename
      id
      name
      fileHash
      imageWidth
      imageHeight
      imageRatio
      blurHash
      type
    }
    bannerSize
    bannerTextHAlign
    bannerTextVAlign
  }
`);
