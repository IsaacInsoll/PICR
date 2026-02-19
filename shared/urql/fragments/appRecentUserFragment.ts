import { gql } from '../gql';

export const appRecentUserFragment = gql(/* GraphQL */ `
  fragment AppRecentUserFragment on User {
    id
    name
    folderId
    lastAccess
    gravatar
    folder {
      id
      name
      parents {
        id
        name
      }
      ...HeroImageFragment
    }
  }
`);
