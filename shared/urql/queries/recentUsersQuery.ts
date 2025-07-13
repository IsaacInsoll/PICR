import { gql } from '../../../frontend/src/helpers/gql';

export const recentUsersQuery = gql(/* GraphQL */ `
  query RecentUsersQuery($folderId: ID!) {
    users(folderId: $folderId, sortByRecent: true, includeChildren: true) {
      id
      name
      folderId
      lastAccess
      gravatar
      folder {
        id
        name
        parents {
          id
          name
        }
      }
    }
  }
`);
