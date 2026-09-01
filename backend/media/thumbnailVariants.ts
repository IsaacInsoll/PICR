import { promises as fs } from 'node:fs';
import { extname, join } from 'path';
import { picrConfig } from '../config/picrConfig.js';
import type { FileFields } from '../db/picrDb.js';

export interface ThumbnailVariant {
  /** Absolute path to the cache entry. */
  path: string;
  /** Most variants are files; legacy pre-v2 video montage variants are directories. */
  isDirectory: boolean;
  /** The cache name segment between the original file name and hash. */
  variantKey: string;
  /** Output suffix after the hash, including the leading dot when present. */
  extension: string;
}

export interface ThumbnailVariantIndex {
  entries(
    relativePath: string,
  ): Promise<readonly ThumbnailVariantDirectoryEntry[]>;
}

export interface ThumbnailVariantDirectoryEntry {
  name: string;
  isDirectory: boolean;
  isFile: boolean;
}

/**
 * Shared, memoized directory scan for cache variant discovery. Long-running
 * migrations must reuse one index instance so thousands of files in the same
 * cache directory do not each call `readdir`.
 */
export const createThumbnailVariantIndex = (): ThumbnailVariantIndex => {
  const cache = new Map<
    string,
    Promise<readonly ThumbnailVariantDirectoryEntry[]>
  >();

  return {
    entries: (relativePath) => {
      const dir = thumbnailVariantDirectory(relativePath);
      let promise = cache.get(dir);
      if (!promise) {
        promise = fs
          .readdir(dir, { withFileTypes: true })
          .then((entries) =>
            entries
              .map((entry) => ({
                name: entry.name,
                isDirectory: entry.isDirectory(),
                isFile: entry.isFile(),
              }))
              .sort((a, b) => a.name.localeCompare(b.name)),
          )
          .catch((err) => {
            if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
            throw err;
          });
        cache.set(dir, promise);
      }
      return promise;
    },
  };
};

const thumbnailVariantDirectory = (relativePath: string): string =>
  join(picrConfig.cachePath, 'thumbs', relativePath);

/**
 * Every existing cache entry for a file at the given (`relativePath`, `name`,
 * `hash`). Callers discover entries from disk rather than recomputing a fixed
 * ladder so cleanup keeps working across renamed/generated variant schemes.
 *
 * The returned variant key and extension allow callers to relocate an entry
 * under a new file name/hash without assuming two independently generated lists
 * line up positionally.
 */
export const thumbnailVariantPaths = async (
  relativePath: string,
  name: string,
  hash: string,
  type: FileFields['type'],
  index: ThumbnailVariantIndex = createThumbnailVariantIndex(),
): Promise<ThumbnailVariant[]> => {
  if (!hash || (type !== 'Image' && type !== 'Video')) return [];

  const dir = thumbnailVariantDirectory(relativePath);
  const entries = await index.entries(relativePath);
  const prefix = `${name}-`;
  const hashSuffix = `-${hash}`;

  return entries.flatMap((entry): ThumbnailVariant[] => {
    if (!entry.name.startsWith(prefix)) return [];
    if (type === 'Image' && !entry.isFile) return [];
    if (type === 'Video' && !entry.isFile && !entry.isDirectory) return [];

    const extension = extname(entry.name);
    const stem = extension
      ? entry.name.slice(0, -extension.length)
      : entry.name;
    if (!stem.endsWith(hashSuffix)) return [];

    const variantKey = stem.slice(
      prefix.length,
      stem.length - hashSuffix.length,
    );
    if (!variantKey) return [];

    return [
      {
        path: join(dir, entry.name),
        isDirectory: entry.isDirectory,
        variantKey,
        extension,
      },
    ];
  });
};

export const thumbnailVariantDestinationPath = (
  relativePath: string,
  name: string,
  hash: string,
  variant: Pick<ThumbnailVariant, 'variantKey' | 'extension'>,
): string =>
  join(
    thumbnailVariantDirectory(relativePath),
    `${name}-${variant.variantKey}-${hash}${variant.extension}`,
  );
