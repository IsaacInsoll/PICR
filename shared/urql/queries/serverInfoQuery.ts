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
      inodeSupport {
        status
        reason
      }
      scanning {
        fileWatcherMode
        onViewScanMode
        scheduledScanHours
        scheduledScan {
          running
          nextScanAt
          lastStartedAt
          lastCompletedAt
          lastDurationMs
          lastError
          lastResult {
            completed
            cleanupRun
            scanPasses
            addedFiles
            changedFiles
            removedFiles
            addedFolders
            movedFiles
            movedFolders
            removedFolders
            ignored
            skippedEntries
            unsettledFiles
            unsettledFolders
          }
        }
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
