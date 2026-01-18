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
    linkMode
    gravatar
    ntfy
    ntfyEmail
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
