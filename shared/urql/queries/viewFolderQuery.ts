import { gql } from '../gql';

export const viewFolderQuery = gql(/*GraphQL*/ `
  query ViewFolder($folderId: ID!) {
    folder(id: $folderId) {
      ...FolderFragment
      files {
        ...AppViewFolderFileFragment
      }
      subFolders {
        ...AppViewFolderSubFolderFragment
      }
    }
  }
`);
