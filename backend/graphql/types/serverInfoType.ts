import {
  GraphQLBoolean,
  GraphQLInt,
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

export const systemInfoType = new GraphQLObjectType({
  name: 'SystemInfo',
  fields: () => ({
    nodeVersion: { type: new GraphQLNonNull(GraphQLString) },
    // "linux x64" etc
    platform: { type: new GraphQLNonNull(GraphQLString) },
    // total system RAM in bytes
    totalMemory: { type: new GraphQLNonNull(GraphQLBigInt) },
    // process uptime in whole seconds
    uptimeSeconds: { type: new GraphQLNonNull(GraphQLInt) },
    // best-effort tool/runtime versions, null when unavailable
    databaseVersion: { type: GraphQLString },
    ffmpegVersion: { type: GraphQLString },
    imageMagickVersion: { type: GraphQLString },
  }),
});

// Free/total space on the volume holding the media directory (bytes).
export const diskInfoType = new GraphQLObjectType({
  name: 'DiskInfo',
  fields: () => ({
    path: { type: new GraphQLNonNull(GraphQLString) },
    free: { type: new GraphQLNonNull(GraphQLBigInt) },
    total: { type: new GraphQLNonNull(GraphQLBigInt) },
  }),
});

export const inodeSupportInfoType = new GraphQLObjectType({
  name: 'InodeSupportInfo',
  fields: () => ({
    // 'enabled' | 'disabled' | 'unknown'
    status: { type: new GraphQLNonNull(GraphQLString) },
    reason: { type: new GraphQLNonNull(GraphQLString) },
  }),
});

export const scheduledScanResultInfoType = new GraphQLObjectType({
  name: 'ScheduledScanResultInfo',
  fields: () => ({
    completed: { type: new GraphQLNonNull(GraphQLBoolean) },
    cleanupRun: { type: new GraphQLNonNull(GraphQLBoolean) },
    scanPasses: { type: new GraphQLNonNull(GraphQLInt) },
    addedFiles: { type: new GraphQLNonNull(GraphQLInt) },
    changedFiles: { type: new GraphQLNonNull(GraphQLInt) },
    removedFiles: { type: new GraphQLNonNull(GraphQLInt) },
    addedFolders: { type: new GraphQLNonNull(GraphQLInt) },
    movedFiles: { type: new GraphQLNonNull(GraphQLInt) },
    movedFolders: { type: new GraphQLNonNull(GraphQLInt) },
    removedFolders: { type: new GraphQLNonNull(GraphQLInt) },
    ignored: { type: new GraphQLNonNull(GraphQLInt) },
    skippedEntries: { type: new GraphQLNonNull(GraphQLInt) },
    unsettledFiles: { type: new GraphQLNonNull(GraphQLInt) },
    unsettledFolders: { type: new GraphQLNonNull(GraphQLInt) },
  }),
});

export const scheduledScanStatusInfoType = new GraphQLObjectType({
  name: 'ScheduledScanStatusInfo',
  fields: () => ({
    running: { type: new GraphQLNonNull(GraphQLBoolean) },
    nextScanAt: { type: GraphQLString },
    lastStartedAt: { type: GraphQLString },
    lastCompletedAt: { type: GraphQLString },
    lastDurationMs: { type: GraphQLInt },
    lastError: { type: GraphQLString },
    lastResult: { type: scheduledScanResultInfoType },
  }),
});

export const mediaScanningInfoType = new GraphQLObjectType({
  name: 'MediaScanningInfo',
  fields: () => ({
    fileWatcherMode: { type: new GraphQLNonNull(GraphQLString) },
    onViewScanMode: { type: new GraphQLNonNull(GraphQLString) },
    scheduledScanHours: { type: new GraphQLNonNull(GraphQLInt) },
    scheduledScan: { type: new GraphQLNonNull(scheduledScanStatusInfoType) },
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
    inodeSupport: { type: new GraphQLNonNull(inodeSupportInfoType) },
    scanning: { type: new GraphQLNonNull(mediaScanningInfoType) },
    mediaCaps: { type: new GraphQLNonNull(mediaCapsInfoType) },
    cacheSize: { type: new GraphQLNonNull(GraphQLBigInt) },
    mediaSize: { type: new GraphQLNonNull(GraphQLBigInt) },
    system: { type: new GraphQLNonNull(systemInfoType) },
    // null when statfs is unavailable for the media path
    disk: { type: diskInfoType },
  }),
});
