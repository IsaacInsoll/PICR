import { gql } from '../gql';

export const folderFragment = gql(/* GraphQL */ `
  fragment FolderFragment on Folder {
    id
    __typename
    name
    title
    subtitle
    parentId
    brandingId
    bannerSize
    bannerTextHAlign
    bannerTextVAlign
    permissions
    folderLastModified
    parents {
      id
      name
    }
    branding {
      ...BrandingFragment
    }
    ...HeroImageFragment
  }
`);
