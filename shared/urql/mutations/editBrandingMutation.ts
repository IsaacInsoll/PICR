import { gql } from '../gql';

export const editBrandingMutation = gql(/* GraphQL */ `
  mutation EditBrandingMutation(
    $id: ID
    $name: String
    $mode: ThemeMode
    $primaryColor: PrimaryColor
    $logoUrl: String
    $headingFontKey: HeadingFontKey
    $availableViews: [String!]
    $defaultView: String
    $defaultFileSort: String
    $thumbnailSize: Int
    $thumbnailSpacing: Int
    $thumbnailBorderRadius: Int
    $headingFontSize: Int
    $headingAlignment: HeadingAlignment
    $footerTitle: String
    $footerUrl: String
    $socialLinks: JSON
  ) {
    editBranding(
      id: $id
      name: $name
      mode: $mode
      primaryColor: $primaryColor
      logoUrl: $logoUrl
      headingFontKey: $headingFontKey
      availableViews: $availableViews
      defaultView: $defaultView
      defaultFileSort: $defaultFileSort
      thumbnailSize: $thumbnailSize
      thumbnailSpacing: $thumbnailSpacing
      thumbnailBorderRadius: $thumbnailBorderRadius
      headingFontSize: $headingFontSize
      headingAlignment: $headingAlignment
      footerTitle: $footerTitle
      footerUrl: $footerUrl
      socialLinks: $socialLinks
    ) {
      id
      name
      mode
      primaryColor
      logoUrl
      headingFontKey
      availableViews
      defaultView
      defaultFileSort
      thumbnailSize
      thumbnailSpacing
      thumbnailBorderRadius
      headingFontSize
      headingAlignment
      footerTitle
      footerUrl
      socialLinks
      folders {
        id
        name
        parents {
          id
        }
      }
    }
  }
`);
