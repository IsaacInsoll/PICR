import { gql } from '../gql';

export const commentHistoryQuery = gql(/* GraphQL */ `
  query commentHistoryQuery($fileId: ID, $folderId: ID) {
    comments(fileId: $fileId, folderId: $folderId) {
      ...AppCommentHistoryCommentFragment
    }
  }
`);
