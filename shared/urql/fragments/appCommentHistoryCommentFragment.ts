import { gql } from '../gql';

export const appCommentHistoryCommentFragment = gql(/* GraphQL */ `
  fragment AppCommentHistoryCommentFragment on Comment {
    id
    comment
    systemGenerated
    timestamp
    userId
    file {
      ...FileFragment
      folder {
        id
        name
        parents {
          id
          name
        }
      }
    }
    user {
      ...AppCommentHistoryUserFragment
    }
  }
`);
