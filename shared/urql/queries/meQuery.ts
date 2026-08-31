import { gql } from '../gql';

export const meQuery = gql(/* GraphQL */ `
  query MeQuery {
    me {
      id
      userType
      name
      folderId
      uuid
      commentPermissions
      linkMode
      folder {
        ...MinimumFolderFragment
      }
    }
    clientInfo {
      baseUrl
      useOriginalsForLightbox
      thumbnailSmallPx
      thumbnailMediumPx
      thumbnailLargePx
      thumbnailJpegQuality
      thumbnailDimensions {
        sm
        md
        lg
      }
      canWrite
    }
  }
`);
