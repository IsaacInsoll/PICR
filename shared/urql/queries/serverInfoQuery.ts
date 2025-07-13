import { gql } from '../../../frontend/src/helpers/gql';

export const serverInfoQuery = gql(/* GraphQL */ `
  query serverInfoQuery {
    serverInfo {
      version
      latest
      databaseUrl
      dev
      usePolling
      host
    }
  }
`);
export const expensiveServerFileSizeQuery = gql(/* GraphQL */ `
  query expensiveServerFileSizeQuery {
    serverInfo {
      cacheSize
      mediaSize
    }
  }
`);
