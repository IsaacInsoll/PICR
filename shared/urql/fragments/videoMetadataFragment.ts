import { gql } from '../gql';

export const videoMetadataFragment = gql(/* GraphQL */ `
  fragment VideoMetadataFragment on Video {
    ... on Video {
      metadata {
        Bitrate
        Duration
        Format
        VideoCodec
        VideoCodecDescription
        Width
        Height
        Framerate
        AudioCodec
        AudioCodecDescription
      }
    }
  }
`);
