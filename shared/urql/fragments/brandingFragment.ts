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
    galleryLayout
    defaultFileSort
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
