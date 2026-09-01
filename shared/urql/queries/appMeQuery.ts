import { gql } from '../gql';

export const appMeQuery = gql(/* GraphQL */ `
  query AppMeQuery {
    me {
      id
      name
      folderId
    }
    clientInfo {
      thumbnailVariants {
        ...ThumbnailVariantFragment
      }
    }
  }
`);
