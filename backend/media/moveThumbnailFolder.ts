import { promises as fs } from 'node:fs';
import { dirname, join } from 'path';
import { picrConfig } from '../config/picrConfig.js';
import { log } from '../logger.js';

const pathExists = async (path: string): Promise<boolean> => {
  try {
    await fs.stat(path);
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw err;
  }
};

const ensureParent = async (path: string): Promise<void> => {
  await fs.mkdir(dirname(path), { recursive: true });
};

const removeIfExists = async (path: string): Promise<void> => {
  try {
    await fs.unlink(path);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }
};

const moveFile = async (from: string, to: string): Promise<void> => {
  try {
    await fs.rename(from, to);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'EXDEV') {
      await ensureParent(to);
      await removeIfExists(to);
      await fs.copyFile(from, to);
      await fs.unlink(from);
      return;
    }
    if (code === 'EEXIST' || code === 'ENOTEMPTY' || code === 'EPERM') {
      await removeIfExists(to);
      await fs.rename(from, to);
      return;
    }
    throw err;
  }
};

const mergeFolders = async (
  from: string,
  to: string,
): Promise<{ hadConflicts: boolean }> => {
  await fs.mkdir(to, { recursive: true });
  let hadConflicts = false;

  const entries = await fs.readdir(from, { withFileTypes: true });
  for (const entry of entries) {
    const src = join(from, entry.name);
    const dest = join(to, entry.name);

    if (entry.isDirectory()) {
      try {
        const destStat = await fs.stat(dest);
        if (destStat.isFile()) {
          await removeIfExists(dest);
        }
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
          hadConflicts = true;
          continue;
        }
      }
      const result = await mergeFolders(src, dest);
      if (result.hadConflicts) hadConflicts = true;
      continue;
    }

    try {
      await moveFile(src, dest);
    } catch (err) {
      hadConflicts = true;
      log(
        'warn',
        `⚠️ Could not move cache file ${src} -> ${dest}: ${(err as Error).message ?? err}`,
      );
    }
  }

  try {
    await fs.rmdir(from);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      hadConflicts = true;
    }
  }

  return { hadConflicts };
};

export const moveThumbnailFolder = async (
  oldRelative: string,
  newRelative: string,
): Promise<void> => {
  if (!oldRelative || !newRelative || oldRelative === newRelative) return;

  const cacheRoot = join(picrConfig.cachePath, 'thumbs');
  const oldPath = join(cacheRoot, oldRelative);
  const newPath = join(cacheRoot, newRelative);

  try {
    if (!(await pathExists(oldPath))) return;

    try {
      await ensureParent(newPath);
      await fs.rename(oldPath, newPath);
      return;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== 'EEXIST' && code !== 'ENOTEMPTY' && code !== 'EXDEV') {
        if (code === 'ENOENT') return;
        throw err;
      }
    }

    const newExists = await pathExists(newPath);
    if (!newExists) {
      await ensureParent(newPath);
      await fs.rename(oldPath, newPath);
      return;
    }

    const { hadConflicts } = await mergeFolders(oldPath, newPath);
    if (hadConflicts) {
      log(
        'warn',
        `⚠️ Cache merge for ${oldRelative} -> ${newRelative} had conflicts; old cache may remain.`,
      );
    }
  } catch (err) {
    log(
      'warn',
      `⚠️ Error moving cache folder ${oldRelative} -> ${newRelative}: ${(err as Error).message ?? err}`,
    );
  }
};
