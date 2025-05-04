import { gql } from '../../helpers/gql';

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
