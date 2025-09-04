import { gql } from '../gql';

export const deleteBrandingMutation = gql(/* GraphQL */ `
  mutation DeleteBrandingMutation($folderId: ID!) {
    deleteBranding(folderId: $folderId) {
      ...FolderFragment
    }
  }
`);
