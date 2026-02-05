import { gql } from '../gql';

export const editBrandingMutation = gql(/* GraphQL */ `
  mutation EditBrandingMutation(
    $folderId: ID!
    $mode: ThemeMode
    $primaryColor: PrimaryColor
    $logoUrl: String
    $headingFontKey: HeadingFontKey
  ) {
    editBranding(
      folderId: $folderId
      mode: $mode
      primaryColor: $primaryColor
      logoUrl: $logoUrl
      headingFontKey: $headingFontKey
    ) {
      ...FolderFragment
    }
  }
`);
