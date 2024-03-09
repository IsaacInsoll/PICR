import { gql } from '../helpers/gql';

export const publicLinkFragment = gql(/* GraphQL */ `
  fragment PublicLinkFragment on PublicLink {
    id
    name
    availableFrom
    availableTo
    enabled
    uuid
    folderId
    folder {
      id
      name
    }
  }
`);
