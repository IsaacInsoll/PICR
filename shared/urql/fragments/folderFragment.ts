import { gql } from '../gql';

export const folderFragment = gql(/* GraphQL */ `
  fragment FolderFragment on Folder {
    id
    __typename
    name
    title
    subtitle
    parentId
    brandingId
    bannerSize
    bannerTextHAlign
    bannerTextVAlign
    permissions
    folderLastModified
    parents {
      id
      name
    }
    branding {
      id
      name
      mode
      primaryColor
      logoUrl
      headingFontKey
      availableViews
      defaultView
      thumbnailSize
      thumbnailSpacing
      thumbnailBorderRadius
      headingFontSize
      headingAlignment
      footerTitle
      footerUrl
      socialLinks
    }
    ...HeroImageFragment
  }
`);
