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
        useOriginalsForLightbox
        thumbnailJpegQuality
        thumbnailVariants {
          ...ThumbnailVariantFragment
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
        ping {
          enabled
          sources {
            name
            watchPrefix
            instanceId
            lastSeenAt
            lastBatchAt
            lastReconcileAt
            hintsReceived
            pingVersion
            lastError
          }
          coordinator {
            state
            pendingFolders
            foldersScanned
            lastError
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
