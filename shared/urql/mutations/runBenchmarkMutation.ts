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
      videoThumbnail {
        ms
        skippedReason
      }
      videoTranscode {
        ms
        skippedReason
      }
    }
  }
`);
