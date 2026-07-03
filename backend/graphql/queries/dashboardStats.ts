import { and, count, eq, inArray, sql, sum } from 'drizzle-orm';
import { GraphQLID, GraphQLNonNull } from 'graphql';
import { contextPermissions } from '../../auth/contextPermissions.js';
import { allSubfolderIds } from '../../helpers/allSubfolders.js';
import { ttlCache } from '../../helpers/ttlCache.js';
import { db } from '../../db/picrDb.js';
import { dbFile } from '../../db/models/index.js';
import type { PicrResolver } from '../helpers/picrResolver.js';
import { parseNumericId } from '../helpers/parseNumericId.js';
import { dashboardStatsType } from '../types/dashboardType.js';

type DashboardStatsSource = {
  totalFiles: number;
  totalImages: number;
  totalFolders: number;
  totalSize: string;
};

type DashboardStatsArgs = {
  folderId: string;
};

const DASHBOARD_STATS_TTL_MS = 15 * 60 * 1000;
const cache = ttlCache<DashboardStatsSource>(DASHBOARD_STATS_TTL_MS);

const resolver: PicrResolver<object, DashboardStatsArgs> = async (
  _,
  params,
  context,
) => {
  const folderId = parseNumericId(params.folderId, 'folderId');
  const { folder } = await contextPermissions(context, folderId, 'Admin');
  const cacheKey = String(folder.id);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const folderIds = await allSubfolderIds(folder);
  const [totals] = await db
    .select({
      totalFiles: count(),
      totalImages: sql<number>`cast(count(*) filter (where ${dbFile.type} = 'Image') as int)`,
      totalSize: sum(dbFile.fileSize),
    })
    .from(dbFile)
    .where(and(inArray(dbFile.folderId, folderIds), eq(dbFile.exists, true)));

  return cache.set(cacheKey, {
    totalFiles: totals.totalFiles,
    totalImages: totals.totalImages,
    totalFolders: folderIds.length - 1,
    totalSize: totals.totalSize ?? '0',
  });
};

export const dashboardStats = {
  type: new GraphQLNonNull(dashboardStatsType),
  resolve: resolver,
  args: { folderId: { type: new GraphQLNonNull(GraphQLID) } },
};
