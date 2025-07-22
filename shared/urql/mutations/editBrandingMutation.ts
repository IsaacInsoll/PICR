import { gql } from '../gql';

export const editBrandingMutation = gql(/* GraphQL */ `
  mutation EditBrandingMutation(
    $folderId: ID!
    $mode: ThemeMode
    $primaryColor: PrimaryColor
    $logoUrl: String
  ) {
    editBranding(
      folderId: $folderId
      mode: $mode
      primaryColor: $primaryColor
      logoUrl: $logoUrl
    ) {
      ...FolderFragment
    }
  }
`);
