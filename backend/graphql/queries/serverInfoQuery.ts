import { serverInfoType } from '../types/serverInfoType.js';
import { requireFullAdmin } from './admins.js';
import fastFolderSizeSync from 'fast-folder-size/sync.js';
import { picrConfig } from '../../config/picrConfig.js';
import type { PicrResolver } from '../helpers/picrResolver.js';
import { getLatestBuild } from '../../helpers/latestBuild.js';
import { getScheduledScanStatus } from '../../filesystem/scheduledScan.js';

const resolver: PicrResolver = async (_, _params, context) => {
  await requireFullAdmin(context);

  const latest = await getLatestBuild({ forceRefresh: true });

  return {
    version: picrConfig.version,
    developmentBuildSha: picrConfig.developmentBuildSha ?? null,
    latest,
    databaseUrl: picrConfig.databaseUrl,
    usePolling: picrConfig.usePolling,
    dev: picrConfig.dev,
    canWrite: picrConfig.canWrite,
    mediaCaps: picrConfig.mediaCaps,
    videoAcceleration: {
      mode: picrConfig.videoAccelerationMode,
      reason: picrConfig.videoAccelerationReason,
      driver: picrConfig.videoAccelerationDriver ?? null,
      codecs: picrConfig.videoAccelerationCodecs ?? [],
    },
    inodeSupport: {
      status: picrConfig.inodeSupport,
      reason: picrConfig.inodeSupportReason,
    },
    scanning: {
      fileWatcherMode: picrConfig.fileWatcherMode,
      onViewScanMode: picrConfig.onViewScanMode,
      scheduledScanHours: picrConfig.scheduledScanHours,
      scheduledScan: getScheduledScanStatus(),
    },
    //these are functions because they can be potentially SUPER EXPENSIVE
    cacheSize: () => folderSize(picrConfig.cachePath),
    mediaSize: () => folderSize(picrConfig.mediaPath),
    host: picrConfig.baseUrl,
  };
};

export const serverInfo = {
  type: serverInfoType,
  resolve: resolver,
};

// This can be slow if it's a large folder
const folderSize = async (path: string) => {
  // console.log('getting size for ', path);
  // await delay(2000);
  return fastFolderSizeSync(path);
};
