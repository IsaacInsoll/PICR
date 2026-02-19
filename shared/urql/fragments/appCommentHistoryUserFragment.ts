import { gql } from '../gql';

export const appCommentHistoryUserFragment = gql(/* GraphQL */ `
  fragment AppCommentHistoryUserFragment on User {
    id
    gravatar
    name
  }
`);
