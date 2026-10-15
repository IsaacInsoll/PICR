import { gql } from '../gql';

export const folderPublicLinksQuery = gql(/* GraphQL */ `
  query FolderPublicLinks($folderId: ID!) {
    users(folderId: $folderId) {
      id
      name
      enabled
      publicationState
      expiresAt
      lastAccess
      gravatar
    }
  }
`);
