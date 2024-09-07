import { gql } from '../../helpers/gql';
import { GraphQLFloat, GraphQLInt, GraphQLString } from 'graphql/index';

const videoMetadataFragment = gql(/* GraphQL */ `
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
