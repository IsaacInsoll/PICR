import { gql } from '../gql';

export const recordFolderVisitMutation = gql(/* GraphQL */ `
  mutation RecordFolderVisit($folderId: ID!) {
    recordFolderVisit(folderId: $folderId)
  }
`);
