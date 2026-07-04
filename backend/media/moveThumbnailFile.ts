import { promises as fs, constants as fsConstants } from 'node:fs';
import { dirname, join } from 'path';
import type { FileType } from '@shared/gql/graphql.js';
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

/**
 * Move one cache entry to `to` without ever overwriting an existing destination,
 * and without damaging the source if the move fails partway (guards against a
 * concurrently-generated thumbnail and against partial failures once this is
 * wired into the runtime).
 *
 * Files: hardlink (or exclusive copy) then unlink the source — the source stays
 * intact until the destination exists.
 *
 * Directories (video montages): claim the destination with an exclusive `mkdir`
 * (fails `EEXIST` if it already exists, so an empty raced dir is never silently
 * replaced the way `rename` would), replicate every entry into it while leaving
 * the source untouched, and only once the new montage is complete remove the
 * source entries and the source dir. A failure mid-replicate leaves the old
 * montage intact and serving; worst case is an orphaned partial destination.
 */
const moveEntryNoOverwrite = async (
  from: string,
  to: string,
  isDirectory: boolean,
): Promise<'moved' | 'conflict'> => {
  await fs.mkdir(dirname(to), { recursive: true });

  if (isDirectory) {
    try {
      await fs.mkdir(to);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'EEXIST') return 'conflict';
      throw err;
    }
    const entries = await fs.readdir(from);
    // Phase 1: replicate every entry into the freshly created (private) dest,
    // leaving the source complete so a mid-way failure can't break it.
    for (const entry of entries) {
      await replicateFileNoOverwrite(join(from, entry), join(to, entry));
    }
    // Phase 2: destination montage is complete -> drop the source.
    for (const entry of entries) {
      await unlinkIfExists(join(from, entry));
    }
    await fs.rmdir(from);
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
 * NEVER unlinks or overwrites existing cache data — each variant resolves to one
 * of four non-fatal categories (see {@link RelocationResult}). A `conflict`
 * leaves both entries untouched; the orphaned source is reclaimed by the
 * Release B sweep. Only an unexpected filesystem error propagates.
 */
export const moveThumbnailFile = async (
  oldRelativePath: string,
  newRelativePath: string,
  oldName: string,
  newName: string,
  hash: string,
  type: FileType | null,
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
