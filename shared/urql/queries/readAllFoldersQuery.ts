import { gql } from '../../../frontend/src/helpers/gql';

export const readAllFoldersQuery = gql(/* GraphQL */ `
  query readAllFoldersQuery($id: ID!, $sort: FoldersSortType, $limit: Int) {
    allFolders(id: $id, sort: $sort, limit: $limit) {
      ...FolderFragment
    }
  }
`);
