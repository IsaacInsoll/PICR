import { gql } from '../gql';

export const folderFragment = gql(/* GraphQL */ `
  fragment FolderFragment on Folder {
    id
    __typename
    name
    title
    subtitle
    parentId
    permissions
    folderLastModified
    parents {
      id
      name
    }
    branding {
      id
      folderId
      mode
      primaryColor
      logoUrl
      headingFontKey
      folder {
        id
        name
      }
    }
    ...HeroImageFragment
  }
`);
