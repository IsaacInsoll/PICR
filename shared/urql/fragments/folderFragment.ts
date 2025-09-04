import { gql } from '../gql';

export const folderFragment = gql(/* GraphQL */ `
  fragment FolderFragment on Folder {
    id
    __typename
    name
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
      folder {
        id
        name
      }
    }
    ...HeroImageFragment
  }
`);
