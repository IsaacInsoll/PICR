import { gql } from '../gql';

export const serverInfoQuery = gql(/* GraphQL */ `
  query serverInfoQuery {
    serverInfo {
      version
      developmentBuildSha
      latest
      databaseUrl
      dev
      host
      canWrite
      mediaCaps {
        raw
        psd
        psb
        heic
      }
      settings {
        avifEnabled
        useOriginalsForLightbox
        thumbnailSmallPx
        thumbnailMediumPx
        thumbnailLargePx
        thumbnailJpegQuality
        thumbnailAvifQuality
        thumbnailDimensions {
          sm
          md
          lg
        }
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
      system {
        nodeVersion
        platform
        totalMemory
        uptimeSeconds
        databaseVersion
        ffmpegVersion
        imageMagickVersion
      }
      disk {
        path
        free
        total
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
