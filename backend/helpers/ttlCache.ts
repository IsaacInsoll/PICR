type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

export const ttlCache = <T>(ttlMs: number) => {
  const cache = new Map<string, CacheEntry<T>>();

  return {
    get: (key: string): T | undefined => {
      const entry = cache.get(key);
      if (!entry) return undefined;
      if (entry.expiresAt <= Date.now()) {
        return undefined;
      }
      return entry.value;
    },
    getStale: (key: string): T | undefined => cache.get(key)?.value,
    set: (key: string, value: T): T => {
      cache.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    },
  };
};
