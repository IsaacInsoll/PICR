import { gql } from '../gql';

export const brandingFragment = gql(/* GraphQL */ `
  fragment BrandingFragment on Branding {
    id
    name
    mode
    primaryColor
    logoUrl
    headingFontKey
    availableViews
    defaultView
    defaultFileSort
    galleryLayout
    thumbnailSize
    thumbnailSpacing
    thumbnailBorderRadius
    headingFontSize
    headingAlignment
    footerTitle
    footerUrl
    socialLinks
  }
`);
