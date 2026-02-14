import { gql } from '../gql';

export const renameFolderMutation = gql(/* GraphQL */ `
  mutation RenameFolder($folderId: ID!, $oldPath: String!, $newPath: String!) {
    renameFolder(folderId: $folderId, oldPath: $oldPath, newPath: $newPath) {
      ...FolderFragment
    }
  }
`);
