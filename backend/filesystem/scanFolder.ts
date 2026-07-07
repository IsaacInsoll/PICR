import { readdir, stat } from 'node:fs/promises';
import type { Stats } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { and, eq } from 'drizzle-orm';
import { log } from '../logger.js';
import { db, dbFolderForId } from '../db/picrDb.js';
import { dbFile, dbFolder } from '../db/models/index.js';
import { addFile } from './events/addFile.js';
import { addFolder } from './events/addFolder.js';
import { removeFile } from './events/removeFile.js';
import { removeFolder } from './events/removeFolder.js';
import { fullPath, fullPathForFile } from './fileManager.js';
import { contentHashForStats } from './fileHash.js';
import { isIgnoredPath } from './ignoredPaths.js';

export const SCAN_SETTLE_SECONDS = 10;
export const SCAN_FASTPATH_MAX_BYTES = 5 * 1024 * 1024;

const PENDING_FOLDER_TTL_MS = 24 * 60 * 60 * 1000;
const SCAN_SETTLE_MS = SCAN_SETTLE_SECONDS * 1000;

export interface ScanFolderOptions {
  generateThumbs?: boolean;
  depth?: number;
}

export interface ScanFolderResult {
  addedFiles: number;
  changedFiles: number;
  removedFiles: number;
  addedFolders: number;
  removedFolders: number;
  ignored: number;
  unsettledFiles: number;
  unsettledFolders: number;
}

interface DiskEntry {
  path: string;
  stats: Stats;
}

interface FileSignature {
  size: number;
  // Integer epoch ms via Date#getTime() — NOT stats.mtimeMs (fractional).
  mtimeEpochMs: number;
}

interface PendingFolder {
  firstSeen: number;
}

const growingFiles = new Map<string, FileSignature>();
const pendingFolders = new Map<number, PendingFolder>();

export const scanFolder = async (
  folderId: number,
  options: ScanFolderOptions = {},
): Promise<ScanFolderResult> => {
  const startedAt = Date.now();
  const folder = await dbFolderForId(folderId);
  if (!folder) throw new Error(`Folder ${folderId} not found`);

  const folderPath = fullPath(folder.relativePath ?? '');
  const result: ScanFolderResult = {
    addedFiles: 0,
    changedFiles: 0,
    removedFiles: 0,
    addedFolders: 0,
    removedFolders: 0,
    ignored: 0,
    unsettledFiles: 0,
    unsettledFolders: 0,
  };

  const diskEntries = await directDiskEntries(folderPath, result);
  // The folder itself vanished from disk since its DB row was created. We can't
  // conclude its children were individually deleted, so short-circuit rather than
  // archiving every child — a vanished folder is unlinked by its parent's scan.
  if (diskEntries === null) return result;

  const diskFiles = new Map<string, DiskEntry>();
  const diskFolders = new Map<string, DiskEntry>();

  for (const [name, entry] of diskEntries) {
    if (entry.stats.isDirectory()) diskFolders.set(name, entry);
    else if (entry.stats.isFile()) diskFiles.set(name, entry);
    else result.ignored++;
  }

  const [dbFiles, dbFolders] = await Promise.all([
    db.query.dbFile.findMany({
      where: and(eq(dbFile.folderId, folder.id), eq(dbFile.exists, true)),
    }),
    db.query.dbFolder.findMany({
      where: and(eq(dbFolder.parentId, folder.id), eq(dbFolder.exists, true)),
    }),
  ]);

  const dbFilesByName = new Map(dbFiles.map((file) => [file.name, file]));
  const dbFoldersByName = new Map(
    dbFolders.map((childFolder) => [childFolder.name, childFolder]),
  );

  for (const [name, entry] of diskFolders) {
    const dbMatch = dbFoldersByName.get(name);
    if (dbMatch) {
      const settled = await scanPendingFolder(dbMatch.id, options, result);
      if (!settled) result.unsettledFolders++;
      continue;
    }

    const addedFolderId = await addFolder(entry.path, entry.stats);
    result.addedFolders++;
    if (addedFolderId) {
      pendingFolders.set(addedFolderId, {
        firstSeen: Date.now(),
      });
      const settled = await scanPendingFolder(addedFolderId, options, result);
      if (!settled) result.unsettledFolders++;
    }
  }

  for (const [name, entry] of diskFiles) {
    const dbMatch = dbFilesByName.get(name);
    if (!dbMatch) {
      if (!isFileSettled(entry.path, entry.stats)) {
        result.unsettledFiles++;
        continue;
      }
      await addFile(entry.path, options.generateThumbs ?? false, entry.stats);
      result.addedFiles++;
      continue;
    }

    if (dbMatch.fileHash === contentHashForStats(entry.stats)) {
      growingFiles.delete(entry.path);
      continue;
    }

    if (!isFileSettled(entry.path, entry.stats)) {
      result.unsettledFiles++;
      continue;
    }
    await addFile(entry.path, options.generateThumbs ?? false, entry.stats);
    result.changedFiles++;
  }

  // Drop growing-file signatures for direct children that vanished since a prior
  // scan (e.g. a partial copy that was aborted or renamed away). Settled/imported
  // files already clear themselves in isFileSettled; this keeps the map from
  // accumulating entries for transient files that never settled.
  for (const path of growingFiles.keys()) {
    if (dirname(path) === folderPath && !diskFiles.has(basename(path))) {
      growingFiles.delete(path);
    }
  }

  for (const file of dbFiles) {
    if (diskFiles.has(file.name)) continue;
    await removeFile(fullPathForFile(file));
    result.removedFiles++;
  }

  for (const childFolder of dbFolders) {
    if (diskFolders.has(childFolder.name)) continue;
    pendingFolders.delete(childFolder.id);
    await removeFolder(fullPath(childFolder.relativePath ?? ''));
    result.removedFolders++;
  }

  logScanResult(folderId, folderPath, startedAt, result);
  return result;
};

const scanPendingFolder = async (
  folderId: number,
  options: ScanFolderOptions,
  parentResult: ScanFolderResult,
): Promise<boolean> => {
  const pendingFolder = pendingFolders.get(folderId);
  if (!pendingFolder) return true;

  if (Date.now() - pendingFolder.firstSeen > PENDING_FOLDER_TTL_MS) {
    pendingFolders.delete(folderId);
    return true;
  }

  if ((options.depth ?? 0) <= 0) return false;

  const childResult = await scanFolder(folderId, {
    ...options,
    depth: (options.depth ?? 0) - 1,
  });
  mergeScanResult(parentResult, childResult);

  if (hasUnsettledWork(childResult)) return false;
  pendingFolders.delete(folderId);
  return true;
};

const isFileSettled = (path: string, stats: Stats): boolean => {
  const signature = fileSignature(stats);
  const ageMs = Date.now() - stats.mtime.getTime();
  const canFastPath =
    stats.size < SCAN_FASTPATH_MAX_BYTES && ageMs >= SCAN_SETTLE_MS;

  if (canFastPath) {
    growingFiles.delete(path);
    return true;
  }

  const previous = growingFiles.get(path);
  growingFiles.set(path, signature);
  if (!previous) return false;

  const settled =
    previous.size === signature.size &&
    previous.mtimeEpochMs === signature.mtimeEpochMs;
  if (settled) growingFiles.delete(path);
  return settled;
};

const fileSignature = (stats: Stats): FileSignature => ({
  size: stats.size,
  mtimeEpochMs: stats.mtime.getTime(),
});

const hasUnsettledWork = (result: ScanFolderResult): boolean =>
  result.unsettledFiles > 0 || result.unsettledFolders > 0;

const mergeScanResult = (
  target: ScanFolderResult,
  source: ScanFolderResult,
): void => {
  target.addedFiles += source.addedFiles;
  target.changedFiles += source.changedFiles;
  target.removedFiles += source.removedFiles;
  target.addedFolders += source.addedFolders;
  target.removedFolders += source.removedFolders;
  target.ignored += source.ignored;
  target.unsettledFiles += source.unsettledFiles;
  target.unsettledFolders += source.unsettledFolders;
};

const logScanResult = (
  folderId: number,
  folderPath: string,
  startedAt: number,
  result: ScanFolderResult,
) => {
  log(
    'debug',
    `scanFolder(${folderId}) ${folderPath}: ${JSON.stringify(result)} in ${Date.now() - startedAt}ms`,
  );
};

const directDiskEntries = async (
  folderPath: string,
  result: ScanFolderResult,
): Promise<Map<string, DiskEntry> | null> => {
  const diskEntries = new Map<string, DiskEntry>();

  let entries;
  try {
    entries = await readdir(folderPath, { withFileTypes: true });
  } catch (error) {
    // Folder vanished from disk since its DB row was created (e.g. deleted while
    // being viewed). Signal "folder gone" (null) so the caller short-circuits
    // instead of archiving every child — and don't throw (an unhandled rejection
    // here would terminate the process, see app.ts).
    if (isNotFoundError(error)) return null;
    throw error;
  }

  for (const entry of entries) {
    const entryPath = join(folderPath, entry.name);
    if (isIgnoredPath(entryPath)) {
      result.ignored++;
      continue;
    }

    try {
      diskEntries.set(entry.name, {
        path: entryPath,
        stats: await stat(entryPath),
      });
    } catch (error) {
      if (isNotFoundError(error)) continue;
      throw error;
    }
  }

  return diskEntries;
};

const isNotFoundError = (error: unknown): boolean => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  );
};
