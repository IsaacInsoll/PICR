import { gql } from '../gql';

export const userFragment = gql(/* GraphQL */ `
  fragment UserFragment on User {
    id
    name
    username
    enabled
    uuid
    folderId
    commentPermissions
    gravatar
    ntfy
    folder {
      id
      name
      parents {
        id
        name
      }
    }
  }
`);
