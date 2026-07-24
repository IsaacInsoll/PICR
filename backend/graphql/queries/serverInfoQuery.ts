import os from 'node:os';
import { statfs } from 'node:fs/promises';
import { sql } from 'drizzle-orm';
import { serverInfoType } from '../types/serverInfoType.js';
import { requireFullAdmin } from './admins.js';
import { picrConfig } from '../../config/picrConfig.js';
import type { PicrResolver } from '../helpers/picrResolver.js';
import { getLatestBuild } from '../../helpers/latestBuild.js';
import { getScheduledScanStatus } from '../../filesystem/scheduledScan.js';
import { db, getServerOptions } from '../../db/picrDb.js';
import { folderSize } from '../../helpers/folderSize.js';
import { resolveServerMediaSettings } from '../../media/serverMediaSettings.js';
import { serverThumbnailDimensions } from '@shared/serverMediaSettings.js';

const resolver: PicrResolver = async (_, _params, context) => {
  await requireFullAdmin(context);

  const latest = await getLatestBuild();
  const settings = resolveServerMediaSettings(await getServerOptions());

  return {
    version: picrConfig.version,
    developmentBuildSha: picrConfig.developmentBuildSha ?? null,
    latest,
    databaseUrl: picrConfig.databaseUrl,
    dev: picrConfig.dev,
    canWrite: picrConfig.canWrite,
    mediaCaps: picrConfig.mediaCaps,
    settings: {
      ...settings,
      thumbnailDimensions: serverThumbnailDimensions(settings),
    },
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
    system: {
      nodeVersion: process.version,
      platform: `${process.platform} ${process.arch}`,
      totalMemory: os.totalmem(),
      uptimeSeconds: Math.round(process.uptime()),
      databaseVersion: await databaseVersion(),
      ffmpegVersion: picrConfig.ffmpegVersion ?? null,
      imageMagickVersion: picrConfig.imageMagickVersion ?? null,
    },
    disk: await diskInfo(picrConfig.mediaPath),
  };
};

export const serverInfo = {
  type: serverInfoType,
  resolve: resolver,
};

// `SELECT version()` returns a long string like
// "PostgreSQL 16.2 (Debian 16.2-1.pgdg120+2) on x86_64-...". Trim it to the
// product + version for display; fall back to the full string, or null on error.
const databaseVersion = async (): Promise<string | null> => {
  try {
    const result = await db.execute(sql`select version()`);
    const row = result.rows[0] as Record<string, unknown> | undefined;
    const versionValue = row?.['version'];
    const full = typeof versionValue === 'string' ? versionValue : null;
    if (!full) return null;
    const match = full.match(/^PostgreSQL\s+(\S+)/);
    return match ? `PostgreSQL ${match[1]}` : full;
  } catch {
    return null;
  }
};

// Free/total bytes on the volume holding `path`. bavail is space available to
// unprivileged users (what actually matters for imports). Null if unsupported.
const diskInfo = async (path: string) => {
  try {
    const stats = await statfs(path);
    return {
      path,
      free: stats.bavail * stats.bsize,
      total: stats.blocks * stats.bsize,
    };
  } catch {
    return null;
  }
};
