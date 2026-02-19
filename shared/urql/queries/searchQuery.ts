import { gql } from '../gql';

export const searchQuery = gql(/* GraphQL */ `
  query searchQuery($folderId: ID!, $query: String!) {
    searchFolders(folderId: $folderId, query: $query) {
      ...AppSearchFolderFragment
    }
    searchFiles(folderId: $folderId, query: $query) {
      ...AppSearchFileFragment
    }
  }
`);
