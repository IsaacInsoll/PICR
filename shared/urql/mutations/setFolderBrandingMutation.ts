import { gql } from '../gql';

export const setFolderBrandingMutation = gql(/* GraphQL */ `
  mutation SetFolderBrandingMutation($folderId: ID!, $brandingId: ID) {
    setFolderBranding(folderId: $folderId, brandingId: $brandingId) {
      ...FolderFragment
    }
  }
`);
