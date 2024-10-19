import { gql } from '../../helpers/gql';

export const readAllFoldersQuery = gql(/* GraphQL */ `
  query readAllFoldersQuery($id: ID!) {
    allFolders(id: $id) {
      ...FolderFragment
    }
  }
`);
