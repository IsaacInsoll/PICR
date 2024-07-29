import { gql } from '../../helpers/gql';
import { j } from 'vite/dist/node/types.d-aGj9QkWt';

export const readAllFoldersQuery = gql(/* GraphQL */ `
  query readAllFoldersQuery($id: ID!) {
    allFolders(id: $id) {
      ...FolderFragment
    }
  }
`);
