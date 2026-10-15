import { gql } from '../gql';

export const userFragment = gql(/* GraphQL */ `
  fragment UserFragment on User {
    id
    name
    username
    enabled
    uuid
    folderId
    lastAccess
    commentPermissions
    linkMode
    publicationState
    estimatedDeliveryAt
    comingSoonMessage
    hasGalleryPasscode
    galleryPasscode
    expiresAt
    gravatar
    ntfy
    ntfyEmail
    folder {
      ...MinimumFolderFragment
    }
  }
`);
