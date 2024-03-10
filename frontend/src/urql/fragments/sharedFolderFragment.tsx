import { gql } from '../../helpers/gql';

export const userFragment = gql(/* GraphQL */ `
  fragment UserFragment on User {
    id
    name
    enabled
    uuid
    folderId
    folder {
      id
      name
    }
  }
`);
