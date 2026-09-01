import { gql } from '../gql';

export const runBenchmarkMutation = gql(/* GraphQL */ `
  mutation RunBenchmarkMutation($assetPath: String) {
    runBenchmark(assetPath: $assetPath) {
      totalMs
      appVersion
      imageCount
      videoCount
      assetSourceUrl
      assetPath
      cpuCount
      uvThreadpoolSize
      videoAccelerationMode
      videoAccelerationReason
      steps {
        key
        name
        status
        ms
        skippedReason
        outputBytes
        details
        includedInTotal
      }
    }
  }
`);
