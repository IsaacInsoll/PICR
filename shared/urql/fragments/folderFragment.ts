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
    permissions
    folderLastModified
    parents {
      id
      name
    }
    branding {
      id
      name
      mode
      primaryColor
      logoUrl
      headingFontKey
    }
    ...HeroImageFragment
  }
`);
