import { gql } from '../gql';

export const rescanFolderMutation = gql(/* GraphQL */ `
  mutation RescanFolder($folderId: ID!) {
    rescanFolder(folderId: $folderId)
  }
`);
