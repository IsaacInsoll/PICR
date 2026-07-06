import { promises as fs, constants as fsConstants } from 'node:fs';
import { dirname, join } from 'path';
import type { FileFields } from '../db/picrDb.js';
import { log } from '../logger.js';
import { thumbnailVariantPaths } from './thumbnailVariants.js';

export interface RelocationResult {
  moved: number; // source present, dest absent -> relocated
  alreadyMoved: number; // source absent, dest present -> nothing to do
  missing: number; // source absent, dest absent -> never generated
  conflict: number; // dest already present -> left both, logged
}

const pathExists = async (path: string): Promise<boolean> => {
  try {
    await fs.stat(path);
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw err;
  }
};

const unlinkIfExists = async (path: string): Promise<void> => {
  try {
    await fs.unlink(path);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }
};

const removeDirIfExists = async (path: string): Promise<void> => {
  try {
    await fs.rm(path, { recursive: true });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }
};

/**
 * Replicate a single file to `to` without overwriting: an atomic hardlink,
 * falling back to an exclusive copy where hardlinks are unsupported. Leaves the
 * source untouched. Returns false if the destination already exists (`EEXIST`).
 */
const replicateFileNoOverwrite = async (
  from: string,
  to: string,
): Promise<boolean> => {
  try {
    await fs.link(from, to);
    return true;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'EEXIST') return false;
    if (
      code === 'EXDEV' ||
      code === 'EPERM' ||
      code === 'ENOSYS' ||
      code === 'EOPNOTSUPP' ||
      code === 'ENOTSUP'
    ) {
      try {
        await fs.copyFile(from, to, fsConstants.COPYFILE_EXCL);
        return true;
      } catch (copyErr) {
        if ((copyErr as NodeJS.ErrnoException).code === 'EEXIST') return false;
        throw copyErr;
      }
    }
    throw err;
  }
};

const replicateEntryNoOverwrite = async (
  from: string,
  to: string,
): Promise<boolean> => {
  const stats = await fs.stat(from);
  if (!stats.isDirectory()) return replicateFileNoOverwrite(from, to);

  try {
    await fs.mkdir(to);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'EEXIST') return false;
    throw err;
  }

  const entries = await fs.readdir(from);
  for (const entry of entries) {
    const replicated = await replicateEntryNoOverwrite(
      join(from, entry),
      join(to, entry),
    );
    if (!replicated) return false;
  }

  return true;
};

const replicateDirectoryContentsNoOverwrite = async (
  from: string,
  to: string,
): Promise<boolean> => {
  const entries = await fs.readdir(from);
  for (const entry of entries) {
    const replicated = await replicateEntryNoOverwrite(
      join(from, entry),
      join(to, entry),
    );
    if (!replicated) return false;
  }

  return true;
};

/**
 * Move one cache entry to `to` without overwriting existing cache data, and
 * without damaging the source if the move fails partway. A non-empty destination
 * is always left intact (callers report it as a conflict); the only thing a move
 * can replace is an *empty* destination directory (see the directory note below),
 * which by definition holds no thumbnails.
 *
 * Files: hardlink (or exclusive copy) then unlink the source — the source stays
 * intact until the destination exists, and an existing destination file is never
 * replaced (`EEXIST` -> caller treats it as a conflict).
 *
 * Directories (video montages): move the whole subtree in one atomic `fs.rename`.
 * This travels any nested content along untouched — including foreign NAS sidecar
 * dirs such as Synology `@eaDir` — and never invokes `copyFile` on a directory.
 * A pre-existing non-empty destination fails `ENOTEMPTY`/`EEXIST` and is reported
 * as a conflict (both left intact). `rename` cannot cross filesystems, but cache
 * moves stay within the cache dir, so the recursive `EXDEV` fallback below is
 * defensive only; it replicates entries non-destructively (source intact on a
 * mid-way failure) before dropping the source.
 */
export const moveEntryNoOverwrite = async (
  from: string,
  to: string,
  isDirectory: boolean,
): Promise<'moved' | 'conflict'> => {
  await fs.mkdir(dirname(to), { recursive: true });

  if (isDirectory) {
    try {
      await fs.rename(from, to);
      return 'moved';
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      // Destination already present: rename replaces an *empty* dir, so a real
      // montage (non-empty) surfaces as ENOTEMPTY/EEXIST -> leave both, conflict.
      if (code === 'EEXIST' || code === 'ENOTEMPTY') return 'conflict';
      // Only a cross-device move needs the manual copy fallback below.
      if (code !== 'EXDEV') throw err;
    }

    try {
      await fs.mkdir(to);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'EEXIST') return 'conflict';
      throw err;
    }
    const replicated = await replicateDirectoryContentsNoOverwrite(from, to);
    if (!replicated) return 'conflict';
    // Destination montage is complete -> drop the source.
    await removeDirIfExists(from);
    return 'moved';
  }

  const replicated = await replicateFileNoOverwrite(from, to);
  if (!replicated) return 'conflict';
  await unlinkIfExists(from);
  return 'moved';
};

/**
 * Non-destructive per-file thumbnail relocation. Moves every cache variant for a
 * file from its old (`relativePath`, `name`) location to a new one, keeping the
 * same content hash (a pure move never changes the hash). Handles both image
 * files and the video montage directory.
 *
 * Never discards existing cache data — a variant is relocated (its source removed
 * only once the destination is in place) and an existing destination is never
 * overwritten. Each variant resolves to one of four non-fatal categories (see
 * {@link RelocationResult}); a `conflict` leaves both entries untouched and the
 * orphaned source is reclaimed by the Release B sweep. Only an unexpected
 * filesystem error propagates.
 */
export const moveThumbnailFile = async (
  oldRelativePath: string,
  newRelativePath: string,
  oldName: string,
  newName: string,
  hash: string,
  type: FileFields['type'],
): Promise<RelocationResult> => {
  const result: RelocationResult = {
    moved: 0,
    alreadyMoved: 0,
    missing: 0,
    conflict: 0,
  };

  if (oldRelativePath === newRelativePath && oldName === newName) return result;

  const sources = thumbnailVariantPaths(oldRelativePath, oldName, hash, type);
  const dests = thumbnailVariantPaths(newRelativePath, newName, hash, type);

  for (let i = 0; i < sources.length; i++) {
    const from = sources[i].path;
    const to = dests[i].path;
    const [sourceExists, destExists] = await Promise.all([
      pathExists(from),
      pathExists(to),
    ]);

    if (!sourceExists && destExists) {
      result.alreadyMoved++;
    } else if (!sourceExists && !destExists) {
      result.missing++;
    } else if (sourceExists && destExists) {
      result.conflict++;
      log(
        'warn',
        `⚠️ Thumbnail relocation conflict (left both): ${from} -> ${to}`,
      );
    } else {
      const outcome = await moveEntryNoOverwrite(
        from,
        to,
        sources[i].isDirectory,
      );
      if (outcome === 'moved') {
        result.moved++;
      } else {
        result.conflict++;
        log(
          'warn',
          `⚠️ Thumbnail relocation conflict (raced, left both): ${from} -> ${to}`,
        );
      }
    }
  }

  return result;
};
