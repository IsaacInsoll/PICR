import { ttlCache } from './ttlCache.js';

const LATEST_BUILD_TTL_MS = 12 * 60 * 60 * 1000;
const CACHE_KEY = 'latest';
const cache = ttlCache<string>(LATEST_BUILD_TTL_MS);

type GetLatestBuildOptions = {
  forceRefresh?: boolean;
};

export const getLatestBuild = async (options: GetLatestBuildOptions = {}) => {
  if (!options.forceRefresh) {
    const cached = cache.get(CACHE_KEY);
    if (cached != null) return cached;
  }

  try {
    const req = await fetch(
      'https://api.github.com/repos/isaacinsoll/picr/releases',
    );
    const json = (await req.json()) as { tag_name: string }[];
    const latest = Array.isArray(json) ? (json[0]?.tag_name ?? '') : '';
    return cache.set(CACHE_KEY, latest);
  } catch {
    return cache.getStale(CACHE_KEY) ?? '';
  }
};

export const resetLatestBuildCacheForTests = () => {
  cache.clear();
};
