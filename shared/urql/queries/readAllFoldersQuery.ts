import { gql } from '../gql';

export const readAllFoldersQuery = gql(/* GraphQL */ `
  query readAllFoldersQuery($id: ID!, $sort: FoldersSortType, $limit: Int) {
    allFolders(id: $id, sort: $sort, limit: $limit) {
      ...FolderFragment
    }
  }
`);
