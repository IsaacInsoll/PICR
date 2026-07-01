import {
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { GraphQLBigInt } from 'graphql-scalars';

export const videoAccelerationInfoType = new GraphQLObjectType({
  name: 'VideoAccelerationInfo',
  fields: () => ({
    // 'cpu' | 'vaapi'
    mode: { type: new GraphQLNonNull(GraphQLString) },
    // human-readable status / fallback reason
    reason: { type: new GraphQLNonNull(GraphQLString) },
    // driver + accelerated codecs only present when mode === 'vaapi'
    driver: { type: GraphQLString },
    codecs: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString)),
      ),
    },
  }),
});

export const mediaCapsInfoType = new GraphQLObjectType({
  name: 'MediaCapsInfo',
  fields: () => ({
    raw: { type: new GraphQLNonNull(GraphQLBoolean) },
    psd: { type: new GraphQLNonNull(GraphQLBoolean) },
    psb: { type: new GraphQLNonNull(GraphQLBoolean) },
    heic: { type: new GraphQLNonNull(GraphQLBoolean) },
  }),
});

export const serverInfoType = new GraphQLObjectType({
  name: 'ServerInfo',
  fields: () => ({
    version: { type: new GraphQLNonNull(GraphQLString) },
    developmentBuildSha: { type: GraphQLString },
    latest: { type: new GraphQLNonNull(GraphQLString) },
    host: { type: new GraphQLNonNull(GraphQLString) },
    databaseUrl: { type: new GraphQLNonNull(GraphQLString) },
    usePolling: { type: new GraphQLNonNull(GraphQLBoolean) },
    dev: { type: new GraphQLNonNull(GraphQLBoolean) },
    canWrite: { type: new GraphQLNonNull(GraphQLBoolean) },
    videoAcceleration: { type: new GraphQLNonNull(videoAccelerationInfoType) },
    mediaCaps: { type: new GraphQLNonNull(mediaCapsInfoType) },
    cacheSize: { type: new GraphQLNonNull(GraphQLBigInt) },
    mediaSize: { type: new GraphQLNonNull(GraphQLBigInt) },
  }),
});
