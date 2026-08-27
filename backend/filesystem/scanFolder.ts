import { readdir, stat } from 'node:fs/promises';
import type { BigIntStats } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { and, eq, isNotNull } from 'drizzle-orm';
import { log } from '../logger.js';
import type { FileFields, FolderFields } from '../db/picrDb.js';
import { db, dbFolderForId } from '../db/picrDb.js';
import { dbFile, dbFolder } from '../db/models/index.js';
import { delay } from '../helpers/delay.js';
import { fileStatsFromBigIntStats, type PicrFileStats } from './fileStats.js';
import { addFile } from './events/addFile.js';
import { addFolder } from './events/addFolder.js';
import { removeFile } from './events/removeFile.js';
import { removeFolder } from './events/removeFolder.js';
import { renameFolder } from './events/renameFolder.js';
import { fullPath, fullPathForFile } from './fileManager.js';
import { contentHashForStats } from './fileHash.js';
import { isIgnoredPath } from '@shared/filesystem/ignoredPaths.js';
import { recordSuccessfulFullLibraryScan } from './scanCoverage.js';

export const SCAN_SETTLE_SECONDS = 10;
export const SCAN_FASTPATH_MAX_BYTES = 5 * 1024 * 1024;

const PENDING_FOLDER_TTL_MS = 24 * 60 * 60 * 1000;
const SCAN_SETTLE_MS = SCAN_SETTLE_SECONDS * 1000;
const inFlightFolderScans = new Map<number, Promise<unknown>>();

export interface ScanFolderOptions {
  generateThumbs?: boolean;
  depth?: number;
  removeMissing?: boolean;
  scanExistingFolders?: boolean;
}

interface InternalScanFolderOptions extends ScanFolderOptions {
  visitedFolderIds: Set<number>;
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
  skippedEntries: number;
  unavailableFolders: number;
  unsettledFiles: number;
  unsettledFolders: number;
}

export interface ScanFolderTreeOptions {
  generateThumbs?: boolean;
  maxPasses?: number;
  settleDelayMs?: number;
}

export interface ScanFolderTreeResult extends ScanFolderResult {
  completed: boolean;
  cleanupRun: boolean;
  scanPasses: number;
}

interface DiskEntry {
  path: string;
  stats: PicrFileStats;
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

export const scanFolderTree = async (
  rootFolderId = 1,
  options: ScanFolderTreeOptions = {},
): Promise<ScanFolderTreeResult> => {
  const startedAtDate = new Date();
  const startedAt = startedAtDate.getTime();
  const maxPasses = Math.max(1, options.maxPasses ?? 2);
  const result: ScanFolderTreeResult = {
    ...emptyScanFolderResult(),
    completed: false,
    cleanupRun: false,
    scanPasses: 0,
  };
  let finalUnsettledFiles = 0;
  let finalUnsettledFolders = 0;

  for (let pass = 0; pass < maxPasses; pass++) {
    if (pass > 0) await delay(options.settleDelayMs ?? SCAN_SETTLE_MS);

    const passResult = await scanFolder(rootFolderId, {
      generateThumbs: options.generateThumbs ?? false,
      depth: Number.MAX_SAFE_INTEGER,
      removeMissing: false,
      scanExistingFolders: true,
    });
    mergeScanResult(result, passResult);
    result.scanPasses++;
    finalUnsettledFiles = passResult.unsettledFiles;
    finalUnsettledFolders = passResult.unsettledFolders;

    if (!hasIncompleteWork(passResult)) {
      result.completed = true;
      break;
    }
  }

  if (result.completed) {
    const cleanupResult = await scanFolder(rootFolderId, {
      generateThumbs: options.generateThumbs ?? false,
      depth: Number.MAX_SAFE_INTEGER,
      removeMissing: true,
      scanExistingFolders: true,
    });
    mergeScanResult(result, cleanupResult);
    result.cleanupRun = true;
    finalUnsettledFiles = cleanupResult.unsettledFiles;
    finalUnsettledFolders = cleanupResult.unsettledFolders;
    result.completed = !hasIncompleteWork(cleanupResult);
  } else {
    log(
      'warn',
      `scanFolderTree(${rootFolderId}) stopped with incomplete filesystem work after ${result.scanPasses} passes`,
    );
  }

  result.unsettledFiles = finalUnsettledFiles;
  result.unsettledFolders = finalUnsettledFolders;
  if (rootFolderId === 1 && result.completed) {
    recordSuccessfulFullLibraryScan(startedAtDate);
  }
  log(
    'debug',
    `scanFolderTree(${rootFolderId}): ${JSON.stringify(result)} in ${Date.now() - startedAt}ms`,
  );
  return result;
};

export const scanFolder = async (
  folderId: number,
  options: ScanFolderOptions = {},
): Promise<ScanFolderResult> => {
  return scanFolderWithLock(folderId, {
    ...options,
    visitedFolderIds: new Set<number>(),
  });
};

const scanFolderWithLock = async (
  folderId: number,
  options: InternalScanFolderOptions,
): Promise<ScanFolderResult> => {
  if (options.visitedFolderIds.has(folderId)) {
    log('warn', `Skipping recursive scan cycle at folder ${folderId}`, true);
    return emptyScanFolderResult();
  }

  // This prevents self-recursion from deadlocking on its own folder lock. It
  // does not try to solve simultaneous scans entering corrupt cycles from
  // different roots; that would need a cross-scan lock ordering strategy.
  const previous = inFlightFolderScans.get(folderId) ?? Promise.resolve();
  const next = previous
    .catch(() => undefined)
    .then(() =>
      scanFolderUnlocked(folderId, {
        ...options,
        visitedFolderIds: new Set(options.visitedFolderIds).add(folderId),
      }),
    );
  inFlightFolderScans.set(folderId, next);

  try {
    return await next;
  } finally {
    if (inFlightFolderScans.get(folderId) === next) {
      inFlightFolderScans.delete(folderId);
    }
  }
};

const scanFolderUnlocked = async (
  folderId: number,
  options: InternalScanFolderOptions,
): Promise<ScanFolderResult> => {
  const startedAt = Date.now();
  const folder = await dbFolderForId(folderId);
  if (!folder) throw new Error(`Folder ${folderId} not found`);

  const folderPath = fullPath(folder.relativePath ?? '');
  const result = emptyScanFolderResult();

  const scanned = await directDiskEntries(folderPath, result);
  // The folder itself vanished from disk since its DB row was created. We can't
  // conclude its children were individually deleted, so short-circuit rather than
  // archiving every child — a vanished folder is unlinked by its parent's scan.
  if (scanned === null) return result;
  const { entries: diskEntries, unreadable: unreadableNames } = scanned;

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
  // Files present in the DB but absent from disk this pass. Entries we simply
  // could not stat (unreadableNames) are NOT "disappeared" — they are still on
  // disk — so they must not become move sources for a new same-hash file.
  const disappearedFiles = dbFiles.filter(
    (file) => !diskFiles.has(file.name) && !unreadableNames.has(file.name),
  );
  const movedFileIds = new Set<number>();
  const movedFolderIds = new Set<number>();

  for (const [name, entry] of diskFolders) {
    const dbMatch = dbFoldersByName.get(name);
    if (dbMatch) {
      await refreshFolderInode(dbMatch, entry.stIno);
      const settled = await scanChildFolder(dbMatch.id, options, result);
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
      const settled = await scanChildFolder(addedFolderId, options, result);
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

  if (options.removeMissing ?? true) {
    for (const file of dbFiles) {
      if (movedFileIds.has(file.id)) continue;
      if (diskFiles.has(file.name)) continue;
      if (unreadableNames.has(file.name)) continue;
      await removeFile(fullPathForFile(file));
      result.removedFiles++;
    }

    for (const childFolder of dbFolders) {
      if (movedFolderIds.has(childFolder.id)) continue;
      if (diskFolders.has(childFolder.name)) continue;
      if (unreadableNames.has(childFolder.name)) continue;
      pendingFolders.delete(childFolder.id);
      await removeFolder(fullPath(childFolder.relativePath ?? ''));
      result.removedFolders++;
    }
  }

  logScanResult(folderId, folderPath, startedAt, result);
  return result;
};

const scanChildFolder = async (
  folderId: number,
  options: InternalScanFolderOptions,
  parentResult: ScanFolderResult,
): Promise<boolean> => {
  let pendingFolder = pendingFolders.get(folderId);
  if (!pendingFolder && !options.scanExistingFolders) return true;

  if (
    pendingFolder &&
    Date.now() - pendingFolder.firstSeen > PENDING_FOLDER_TTL_MS
  ) {
    pendingFolders.delete(folderId);
    pendingFolder = undefined;
    if (!options.scanExistingFolders) return true;
  }

  if ((options.depth ?? 0) <= 0) return !pendingFolder;

  const childResult = await scanFolderWithLock(folderId, {
    ...options,
    depth: (options.depth ?? 0) - 1,
  });
  mergeScanResult(parentResult, childResult);

  if (hasIncompleteWork(childResult)) return false;
  pendingFolders.delete(folderId);
  return true;
};

const isFileSettled = (path: string, stats: PicrFileStats): boolean => {
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

const emptyScanFolderResult = (): ScanFolderResult => ({
  addedFiles: 0,
  changedFiles: 0,
  removedFiles: 0,
  addedFolders: 0,
  movedFiles: 0,
  movedFolders: 0,
  removedFolders: 0,
  ignored: 0,
  skippedEntries: 0,
  unavailableFolders: 0,
  unsettledFiles: 0,
  unsettledFolders: 0,
});

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

const fileSignature = (stats: PicrFileStats): FileSignature => ({
  size: stats.size,
  mtimeEpochMs: stats.mtime.getTime(),
});

const hasIncompleteWork = (result: ScanFolderResult): boolean =>
  result.unsettledFiles > 0 ||
  result.unsettledFolders > 0 ||
  result.unavailableFolders > 0;

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
  target.skippedEntries += source.skippedEntries;
  target.unavailableFolders += source.unavailableFolders;
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
): Promise<{
  entries: Map<string, DiskEntry>;
  unreadable: Set<string>;
} | null> => {
  const entries = new Map<string, DiskEntry>();
  // Names of entries we could see (via readdir) but couldn't stat this pass. They
  // exist on disk, so the removeMissing sweep must NOT archive their DB rows.
  const unreadable = new Set<string>();

  let dirEntries;
  try {
    dirEntries = await readdir(folderPath, { withFileTypes: true });
  } catch (error) {
    // Folder vanished from disk since its DB row was created (e.g. deleted while
    // being viewed). Signal "folder gone" (null) so the caller short-circuits
    // instead of archiving every child — and don't throw (an unhandled rejection
    // here would terminate the process, see app.ts).
    if (isNotFoundError(error)) {
      result.unavailableFolders++;
      return null;
    }
    // Unreadable folder (permissions, flaky NAS mount, transient I/O error): we
    // couldn't list it, so we can't conclude its children are gone. Log and
    // short-circuit WITHOUT archiving, rather than aborting the whole walk.
    if (isFilesystemError(error)) {
      result.skippedEntries++;
      result.unavailableFolders++;
      log(
        'warn',
        `Skipping unreadable folder ${folderPath}: ${errorMessage(error)}`,
      );
      return null;
    }
    throw error;
  }

  for (const entry of dirEntries) {
    const entryPath = join(folderPath, entry.name);
    if (isIgnoredPath(entryPath)) {
      result.ignored++;
      continue;
    }

    try {
      entries.set(
        entry.name,
        diskEntryForStats(entryPath, await stat(entryPath, { bigint: true })),
      );
    } catch (error) {
      if (isNotFoundError(error)) continue;
      // Unreadable entry (permissions, symlink loop, transient NAS error): skip it
      // but remember the name so removeMissing does not archive its DB row — the
      // file/folder is present, we just couldn't stat it this pass. One bad entry
      // must not abort the whole folder scan.
      if (isFilesystemError(error)) {
        result.skippedEntries++;
        unreadable.add(entry.name);
        log(
          'warn',
          `Skipping unreadable entry ${entryPath}: ${errorMessage(error)}`,
        );
        continue;
      }
      throw error;
    }
  }

  return { entries, unreadable };
};

const pathExists = async (path: string): Promise<boolean> => {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (isNotFoundError(error)) return false;
    // Unreadable old path (EACCES/EIO/ESTALE/ELOOP/…): we cannot confirm it is
    // gone, so treat it as still present. This keeps the inode move guard from
    // aborting the whole scan and, conservatively, avoids re-homing a row whose
    // old path may still exist.
    if (isFilesystemError(error)) return true;
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

// A Node filesystem error carries a string `code` (EACCES, EIO, ESTALE, ELOOP, …).
// We log-and-skip these so one unreadable entry can't abort a whole reconcile;
// anything without a code (a real programming error) still throws.
const isFilesystemError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  typeof (error as { code?: unknown }).code === 'string';

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const diskEntryForStats = (path: string, stats: BigIntStats): DiskEntry => ({
  path,
  stats: fileStatsFromBigIntStats(stats),
  stIno: stats.ino > 0n ? stats.ino : null,
});
