import { gql } from '../gql';

export const runBenchmarkMutation = gql(/* GraphQL */ `
  mutation RunBenchmarkMutation {
    runBenchmark {
      totalMs
      appVersion
      imageCount
      videoCount
      assetSourceUrl
      assetPath
      assetSetup {
        ms
        skippedReason
      }
      jpegResize {
        ms
        skippedReason
      }
      avifResize {
        ms
        skippedReason
      }
      videoThumbnailCpu {
        ms
        skippedReason
      }
      videoThumbnailAccelerated {
        ms
        skippedReason
      }
      videoTranscodeCpu {
        ms
        skippedReason
      }
      videoTranscodeAccelerated {
        ms
        skippedReason
      }
      videoAccelerationMode
      videoAccelerationReason
    }
  }
`);
