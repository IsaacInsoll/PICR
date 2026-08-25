import { gql } from '../gql';

export const publicLinkInfoQuery = gql(/* GraphQL */ `
  query PublicLinkInfoQuery($uuid: String!) {
    publicLinkInfo(uuid: $uuid) {
      status
      expiresAt
      available
      requiresPasscode
      unlocked
      galleryName
      branding {
        mode
        primaryColor
        headingFontKey
        headingFontSize
        headingAlignment
      }
    }
  }
`);
