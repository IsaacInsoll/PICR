import { gql } from '../../helpers/gql';

export const meQuery = gql(/* GraphQL */ `
  query MeQuery {
    me {
      id
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
