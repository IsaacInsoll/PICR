import { ttlCache } from './ttlCache.js';
import { clean, prerelease, rcompare } from 'semver';

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
    if (!req.ok) return cache.getStale(CACHE_KEY) ?? '';

    const json = (await req.json()) as { tag_name?: unknown }[];
    const latest = Array.isArray(json)
      ? json
          .map((release) =>
            typeof release.tag_name === 'string'
              ? clean(release.tag_name)
              : null,
          )
          .filter((version): version is string => version != null)
          .filter((version) => prerelease(version) === null)
          .sort(rcompare)[0]
      : '';
    if (!latest) return cache.getStale(CACHE_KEY) ?? '';
    return cache.set(CACHE_KEY, latest);
  } catch {
    return cache.getStale(CACHE_KEY) ?? '';
  }
};

export const resetLatestBuildCacheForTests = () => {
  cache.clear();
};
