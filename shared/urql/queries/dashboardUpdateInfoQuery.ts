import { gql } from '../gql';

export const dashboardUpdateInfoQuery = gql(/* GraphQL */ `
  query dashboardUpdateInfoQuery {
    dashboardUpdateInfo {
      version
      latest
    }
  }
`);
