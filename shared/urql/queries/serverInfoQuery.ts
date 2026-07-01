import { gql } from '../gql';

export const serverInfoQuery = gql(/* GraphQL */ `
  query serverInfoQuery {
    serverInfo {
      version
      developmentBuildSha
      latest
      databaseUrl
      dev
      usePolling
      host
      canWrite
      mediaCaps {
        raw
        psd
        psb
        heic
      }
      videoAcceleration {
        mode
        reason
        driver
        codecs
      }
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
