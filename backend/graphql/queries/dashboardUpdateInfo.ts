import { GraphQLNonNull } from 'graphql';
import { doAuthError } from '../../auth/doAuthError.js';
import { picrConfig } from '../../config/picrConfig.js';
import { getLatestBuild } from '../../helpers/latestBuild.js';
import { ttlCache } from '../../helpers/ttlCache.js';
import type { PicrResolver } from '../helpers/picrResolver.js';
import { dashboardUpdateInfoType } from '../types/dashboardType.js';

type DashboardUpdateInfoSource = {
  version: string;
  latest: string;
};

const DASHBOARD_UPDATE_TTL_MS = 12 * 60 * 60 * 1000;
const CACHE_KEY = 'latest';
const cache = ttlCache<DashboardUpdateInfoSource>(DASHBOARD_UPDATE_TTL_MS);

const resolver: PicrResolver = async (_, _params, context) => {
  const version = picrConfig.version ?? '';
  const user = context.user;
  if (!user) {
    doAuthError('NOT_LOGGED_IN');
    return { version, latest: version };
  }
  if (user.userType === 'Link') doAuthError('INVALID_LINK');
  if (user.userType !== 'Admin') doAuthError('ACCESS_DENIED');

  const cached = cache.get(CACHE_KEY);
  if (cached) return cached;

  try {
    const latest = (await getLatestBuild()) || version;
    return cache.set(CACHE_KEY, { version, latest });
  } catch {
    return cache.getStale(CACHE_KEY) ?? { version, latest: version };
  }
};

export const dashboardUpdateInfo = {
  type: new GraphQLNonNull(dashboardUpdateInfoType),
  resolve: resolver,
};
