import { gql } from '../gql';

export const recentUsersQuery = gql(/* GraphQL */ `
  query RecentUsersQuery($folderId: ID!) {
    users(folderId: $folderId, sortByRecent: true, includeChildren: true) {
      ...AppRecentUserFragment
    }
  }
`);
