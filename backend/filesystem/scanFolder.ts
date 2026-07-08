import { readdir, stat } from 'node:fs/promises';
import type { Stats } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { and, eq, isNotNull } from 'drizzle-orm';
import { log } from '../logger.js';
import type { FileFields, FolderFields } from '../db/picrDb.js';
import { db, dbFolderForId } from '../db/picrDb.js';
import { dbFile, dbFolder } from '../db/models/index.js';
import { addFile } from './events/addFile.js';
import { addFolder } from './events/addFolder.js';
import { removeFile } from './events/removeFile.js';
import { removeFolder } from './events/removeFolder.js';
import { renameFolder } from './events/renameFolder.js';
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
  movedFiles: number;
  movedFolders: number;
  removedFolders: number;
  ignored: number;
  unsettledFiles: number;
  unsettledFolders: number;
}

interface DiskEntry {
  path: string;
  stats: Stats;
  stIno: bigint | null;
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
    movedFiles: 0,
    movedFolders: 0,
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
  const disappearedFiles = dbFiles.filter((file) => !diskFiles.has(file.name));
  const movedFileIds = new Set<number>();
  const movedFolderIds = new Set<number>();

  for (const [name, entry] of diskFolders) {
    const dbMatch = dbFoldersByName.get(name);
    if (dbMatch) {
      await refreshFolderInode(dbMatch, entry.stIno);
      const settled = await scanPendingFolder(dbMatch.id, options, result);
      if (!settled) result.unsettledFolders++;
      continue;
    }

    const moveCandidate = await findMovedFolderCandidate(entry);
    if (moveCandidate) {
      await renameFolder(
        fullPath(moveCandidate.relativePath ?? ''),
        entry.path,
        entry.stats,
        entry.stIno,
      );
      movedFolderIds.add(moveCandidate.id);
      result.movedFolders++;
      continue;
    }

    const addedFolderId = await addFolder(entry.path, entry.stats, entry.stIno);
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
      const moveCandidate = await findMovedFileCandidate(
        entry,
        disappearedFiles.filter((file) => !movedFileIds.has(file.id)),
      );
      if (moveCandidate) {
        await addFile(
          entry.path,
          options.generateThumbs ?? false,
          entry.stats,
          fullPathForFile(moveCandidate),
          entry.stIno,
        );
        growingFiles.delete(entry.path);
        movedFileIds.add(moveCandidate.id);
        result.movedFiles++;
        continue;
      }

      if (!isFileSettled(entry.path, entry.stats)) {
        result.unsettledFiles++;
        continue;
      }
      await addFile(
        entry.path,
        options.generateThumbs ?? false,
        entry.stats,
        undefined,
        entry.stIno,
      );
      result.addedFiles++;
      continue;
    }

    await refreshFileInode(dbMatch, entry.stIno);

    if (dbMatch.fileHash === contentHashForStats(entry.stats)) {
      growingFiles.delete(entry.path);
      continue;
    }

    if (!isFileSettled(entry.path, entry.stats)) {
      result.unsettledFiles++;
      continue;
    }
    await addFile(
      entry.path,
      options.generateThumbs ?? false,
      entry.stats,
      undefined,
      entry.stIno,
    );
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
    if (movedFileIds.has(file.id)) continue;
    if (diskFiles.has(file.name)) continue;
    await removeFile(fullPathForFile(file));
    result.removedFiles++;
  }

  for (const childFolder of dbFolders) {
    if (movedFolderIds.has(childFolder.id)) continue;
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

const findMovedFileCandidate = async (
  entry: DiskEntry,
  disappearedFiles: FileFields[],
): Promise<FileFields | undefined> => {
  const inodeCandidate = await singleFileCandidateByInode(entry);
  if (inodeCandidate) return inodeCandidate;

  const hash = contentHashForStats(entry.stats);
  const hashCandidates = disappearedFiles.filter(
    (file) => file.fileHash === hash,
  );
  if (hashCandidates.length === 1) return hashCandidates[0];
  if (hashCandidates.length > 1) {
    log(
      'warn',
      `Ambiguous scan file move by content hash for ${entry.path}: ${hashCandidates.length} candidates`,
    );
  }
  return undefined;
};

const singleFileCandidateByInode = async (
  entry: DiskEntry,
): Promise<FileFields | undefined> => {
  if (!entry.stIno) return undefined;
  const candidates = await db
    .select()
    .from(dbFile)
    .where(and(eq(dbFile.exists, true), eq(dbFile.stIno, entry.stIno)));

  const movedCandidates: FileFields[] = [];
  for (const candidate of candidates) {
    if (!(await pathExists(fullPathForFile(candidate)))) {
      movedCandidates.push(candidate);
    }
  }

  if (movedCandidates.length === 1) return movedCandidates[0];
  if (movedCandidates.length > 1) {
    log(
      'warn',
      `Ambiguous scan file move by inode ${entry.stIno.toString()} for ${entry.path}: ${movedCandidates.length} candidates`,
    );
  }
  return undefined;
};

const findMovedFolderCandidate = async (
  entry: DiskEntry,
): Promise<FolderFields | undefined> => {
  if (!entry.stIno) return undefined;
  const candidates = await db
    .select()
    .from(dbFolder)
    .where(
      and(
        eq(dbFolder.exists, true),
        eq(dbFolder.stIno, entry.stIno),
        isNotNull(dbFolder.parentId),
      ),
    );
  if (candidates.length === 1) return candidates[0];
  if (candidates.length > 1) {
    log(
      'warn',
      `Ambiguous scan folder move by inode ${entry.stIno.toString()} for ${entry.path}: ${candidates.length} candidates`,
    );
  }
  return undefined;
};

const refreshFileInode = async (
  file: Pick<FileFields, 'id' | 'stIno'>,
  stIno: bigint | null,
): Promise<void> => {
  if (!stIno || file.stIno === stIno) return;
  await db.update(dbFile).set({ stIno }).where(eq(dbFile.id, file.id));
  file.stIno = stIno;
};

const refreshFolderInode = async (
  folder: Pick<FolderFields, 'id' | 'stIno'>,
  stIno: bigint | null,
): Promise<void> => {
  if (!stIno || folder.stIno === stIno) return;
  await db.update(dbFolder).set({ stIno }).where(eq(dbFolder.id, folder.id));
  folder.stIno = stIno;
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
  target.movedFiles += source.movedFiles;
  target.movedFolders += source.movedFolders;
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
        stIno: await inodeForPath(entryPath),
      });
    } catch (error) {
      if (isNotFoundError(error)) continue;
      throw error;
    }
  }

  return diskEntries;
};

const inodeForPath = async (path: string): Promise<bigint | null> => {
  const stats = await stat(path, { bigint: true });
  return stats.ino > 0n ? stats.ino : null;
};

const pathExists = async (path: string): Promise<boolean> => {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (isNotFoundError(error)) return false;
    throw error;
  }
};

const isNotFoundError = (error: unknown): boolean => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  );
};
