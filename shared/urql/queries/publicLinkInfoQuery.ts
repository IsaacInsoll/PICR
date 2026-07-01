import { gql } from '../gql';

export const publicLinkInfoQuery = gql(/* GraphQL */ `
  query PublicLinkInfoQuery($uuid: String!) {
    publicLinkInfo(uuid: $uuid) {
      requiresPasscode
      unlocked
    }
  }
`);
