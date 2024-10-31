import { gql } from '../helpers/gql';

export const searchQuery = gql(/* GraphQL */ `
  query searchQuery($folderId: ID!, $query: String!) {
    searchFolders(folderId: $folderId, query: $query) {
      ...FolderFragment
    }
    searchFiles(folderId: $folderId, query: $query) {
      ...FileFragment
      folder {
        ...MinimumFolderFragment
      }
    }
  }
`);
