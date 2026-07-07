import { readdir, stat } from 'node:fs/promises';
import type { Stats } from 'node:fs';
import { join } from 'node:path';
import { and, eq } from 'drizzle-orm';
import { db, dbFolderForId } from '../db/picrDb.js';
import { dbFile, dbFolder } from '../db/models/index.js';
import { addFile } from './events/addFile.js';
import { addFolder } from './events/addFolder.js';
import { removeFile } from './events/removeFile.js';
import { removeFolder } from './events/removeFolder.js';
import { fullPath, fullPathForFile } from './fileManager.js';
import { contentHashForStats } from './fileHash.js';
import { isIgnoredPath } from './ignoredPaths.js';

export interface ScanFolderOptions {
  generateThumbs?: boolean;
}

export interface ScanFolderResult {
  addedFiles: number;
  changedFiles: number;
  removedFiles: number;
  addedFolders: number;
  removedFolders: number;
  ignored: number;
}

interface DiskEntry {
  path: string;
  stats: Stats;
}

export const scanFolder = async (
  folderId: number,
  options: ScanFolderOptions = {},
): Promise<ScanFolderResult> => {
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
    if (dbFoldersByName.has(name)) continue;
    await addFolder(entry.path, entry.stats);
    result.addedFolders++;
  }

  for (const [name, entry] of diskFiles) {
    const dbMatch = dbFilesByName.get(name);
    if (!dbMatch) {
      await addFile(entry.path, options.generateThumbs ?? false, entry.stats);
      result.addedFiles++;
      continue;
    }

    if (dbMatch.fileHash !== contentHashForStats(entry.stats)) {
      await addFile(entry.path, options.generateThumbs ?? false, entry.stats);
      result.changedFiles++;
    }
  }

  for (const file of dbFiles) {
    if (diskFiles.has(file.name)) continue;
    await removeFile(fullPathForFile(file));
    result.removedFiles++;
  }

  for (const childFolder of dbFolders) {
    if (diskFolders.has(childFolder.name)) continue;
    await removeFolder(fullPath(childFolder.relativePath ?? ''));
    result.removedFolders++;
  }

  return result;
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
