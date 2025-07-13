import { gql } from '../../../frontend/src/helpers/gql';

export const meQuery = gql(/* GraphQL */ `
  query MeQuery {
    me {
      id
      userType
      name
      folderId
      uuid
      commentPermissions
      folder {
        id
        name
      }
    }
    clientInfo {
      avifEnabled
    }
  }
`);
