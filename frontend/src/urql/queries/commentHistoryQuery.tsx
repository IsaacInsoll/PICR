import { gql } from '../../helpers/gql';

export const commentHistoryQuery = gql(/* GraphQL */ `
  query commentHistoryQuery($fileId: ID, $folderId: ID) {
    comments(fileId: $fileId, folderId: $folderId) {
      id
      comment
      systemGenerated
      timestamp
      user {
        id
      }
      file {
        ...FileFragment
      }
    }
  }
`);
