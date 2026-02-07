import { gql } from '../gql';

export const editBrandingMutation = gql(/* GraphQL */ `
  mutation EditBrandingMutation(
    $id: ID
    $name: String
    $mode: ThemeMode
    $primaryColor: PrimaryColor
    $logoUrl: String
    $headingFontKey: HeadingFontKey
  ) {
    editBranding(
      id: $id
      name: $name
      mode: $mode
      primaryColor: $primaryColor
      logoUrl: $logoUrl
      headingFontKey: $headingFontKey
    ) {
      id
      name
      mode
      primaryColor
      logoUrl
      headingFontKey
      folders {
        id
        name
      }
    }
  }
`);
