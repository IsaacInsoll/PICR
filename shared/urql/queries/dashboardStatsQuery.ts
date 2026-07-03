import { gql } from '../gql';

// Library totals for the dashboard stat bar. These are subtree aggregates
// (see folderType) so they can be slow on large libraries — the dashboard loads
// this in its own query so it never blocks the rest of the page.
export const dashboardStatsQuery = gql(/* GraphQL */ `
  query dashboardStatsQuery($folderId: ID!) {
    dashboardStats(folderId: $folderId) {
      totalFiles
      totalImages
      totalFolders
      totalSize
    }
  }
`);
