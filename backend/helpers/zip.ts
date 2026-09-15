import crypto from 'crypto';
import fs from 'fs';
import archiver from 'archiver';
import { mkdirSync } from 'node:fs';
import { rename, rm } from 'node:fs/promises';
import { updateZipQueue } from './zipQueue.js';
import { log } from '../logger.js';
import { picrConfig } from '../config/picrConfig.js';
import { allSubfolderIds } from './allSubfolders.js';
import { fullPathForFile } from '../filesystem/fileManager.js';
import { and, eq, inArray } from 'drizzle-orm';
import { dbFile } from '../db/models/index.js';
import type { FolderFields } from '../db/picrDb.js';
import { db } from '../db/picrDb.js';

export interface ZipSourceFile {
  id: number;
  fileHash: string | null;
  relativePath: string;
  name: string;
  archivePath: string;
}

export interface FolderHash {
  folder: FolderFields;
  hash: string;
  key: string; //folderId+key
  files: ZipSourceFile[];
}

const archivePathForFile = (
  file: Pick<ZipSourceFile, 'relativePath' | 'name'>,
  rootPath: string,
) => {
  const relativeDirectory =
    file.relativePath === rootPath
      ? ''
      : file.relativePath.startsWith(`${rootPath}/`)
        ? file.relativePath.slice(rootPath.length + 1)
        : file.relativePath;
  return relativeDirectory ? `${relativeDirectory}/${file.name}` : file.name;
};

export const hashZipFiles = (
  folder: FolderFields,
  files: ZipSourceFile[],
  selectionIdentity: string,
): FolderHash => {
  const hash = crypto.createHash('sha256');
  hash.update(
    JSON.stringify({
      selectionIdentity,
      files: files.map(({ id, fileHash, relativePath, name, archivePath }) => ({
        id,
        fileHash,
        relativePath,
        name,
        archivePath,
      })),
    }),
  );
  const value = hash.digest('hex');
  return { hash: value, folder, key: folder.id + value, files };
};

// Hash FolderIDs + FileHashes, used for determining 'uniqueness' for generating zip files
export const hashFolderContents = async (
  folder: FolderFields,
): Promise<FolderHash> => {
  const folderIds = await allSubfolderIds(folder);

  const rows = await db.query.dbFile.findMany({
    columns: {
      id: true,
      fileHash: true,
      relativePath: true,
      name: true,
    },
    where: and(inArray(dbFile.folderId, folderIds), eq(dbFile.exists, true)),
  });
  const rootPath = folder.relativePath ?? '';
  const files = rows
    .map((file) => ({
      ...file,
      archivePath: archivePathForFile(file, rootPath),
    }))
    .sort((left, right) => left.id - right.id);
  return hashZipFiles(folder, files, `folder:${folderIds.join(',')}`);
};

//this is copy paste from docs, hopefully you never see it in this half-assed state 😊
export const zipFolder = async (folderHash: FolderHash) => {
  const { hash, files } = folderHash;
  const path = zipPath(folderHash);
  // addToZipQueue and zipRequest treat an existing final path as a complete,
  // immutable download. Write beside it and rename only after every entry has
  // been flushed, so a failed or interrupted archive can never be served.
  const partialPath = `${path}.partial`;
  const output = fs.createWriteStream(partialPath);
  const archive = archiver('zip', { zlib: { level: 9 } }); // Sets the compression level.

  updateZipQueue(folderHash, { status: 'In Progress', hash });
  const completed = new Promise<void>((resolve, reject) => {
    output.once('close', resolve);
    output.once('error', reject);
    archive.once('error', reject);
    // A warning is commonly an unreadable or vanished source file. Completing
    // without it would make the archive disagree with the selected count, so
    // filtered and whole-folder downloads both fail rather than silently omit it.
    archive.once('warning', reject);
  });
  archive.pipe(output);
  log('info', '🗜️ Creating ZIP at path: ' + path);

  // output.on('close', function () {
  //   logger('🗜️ ZIP Done: ' + path + ' ' + archive.pointer() + ' total bytes');
  // });

  archive.on('warning', (warning) => {
    log('warn', '🗜️ ZIP WARNING: ' + String(warning));
  });
  //
  archive.on('progress', ({ entries, fs }) => {
    // console.log('progress', { entries, fs });
    updateZipQueue(folderHash, {
      filesDone: entries.processed,
      filesTotal: entries.total,
      bytesDone: Math.round(fs.processedBytes / 1000000),
      bytesTotal: Math.round(fs.totalBytes / 1000000),
    });
  });
  // archive.on('entry', (x) => console.log('entry', x));

  //TODO: add empty folders

  try {
    files.forEach((f) => {
      archive.file(fullPathForFile(f), { name: f.archivePath });
    });
    // Await both together: if the archive fails, finalize() rejects and so
    // does `completed`. Awaiting them in sequence would leave the second
    // rejection unhandled, which the process-level handler treats as fatal.
    await Promise.all([archive.finalize(), completed]);
    await rename(partialPath, path);
    log('info', '🗜️ ZIP Completed');
    updateZipQueue(folderHash, { status: 'Complete' });
  } catch (error) {
    log('error', '🗜️ ZIP ERROR: ' + String(error));
    // The `once('error')` listeners above are spent. A late error event with no
    // listener would be thrown as an uncaught exception, which is fatal here.
    archive.on('error', () => undefined);
    output.on('error', () => undefined);
    archive.abort();
    output.destroy();
    await rm(partialPath, { force: true }).catch((cleanupError: unknown) => {
      log(
        'warn',
        `🗜️ Could not remove partial ZIP ${partialPath}: ${String(cleanupError)}`,
      );
    });
    updateZipQueue(folderHash, { status: 'Error' });
    throw error;
  }
};

export const zipPath = (folderHash: Pick<FolderHash, 'folder' | 'hash'>) => {
  const path = picrConfig.cachePath + '/zip/' + folderHash.folder.name;
  mkdirSync(path, { recursive: true });
  return `${path}/${folderHash.hash}.zip`;
};
