import crypto from 'crypto';
import fs from 'fs';
import archiver from 'archiver';
import { mkdirSync } from 'node:fs';
import { updateZipQueue } from './zipQueue.js';
import { log } from '../logger.js';
import { picrConfig } from '../config/picrConfig.js';
import { allSubfolderIds } from './allSubfolders.js';
import { fullPathForFile, fullPathMinus } from '../filesystem/fileManager.js';
import { and, eq, inArray } from 'drizzle-orm';
import { dbFile } from '../db/models/index.js';
import type { FolderFields } from '../db/picrDb.js';
import { db } from '../db/picrDb.js';

export interface FolderHash {
  folder: FolderFields;
  hash: string;
  key: string; //folderId+key
}

// Hash FolderIDs + FileHashes, used for determining 'uniqueness' for generating zip files
export const hashFolderContents = async (
  folder: FolderFields,
): Promise<FolderHash> => {
  const folderIds = await allSubfolderIds(folder);

  const files = await db.query.dbFile.findMany({
    columns: { id: true, fileHash: true },
    where: and(inArray(dbFile.folderId, folderIds), eq(dbFile.exists, true)),
  });

  const hash = crypto.createHash('sha256');
  hash.update(files.map((f) => f.fileHash).join(',') + folderIds.join(','));
  const h = hash.digest('hex');
  return { hash: h, folder, key: folder.id + h };
};

//this is copy paste from docs, hopefully you never see it in this half-assed state 😊
export const zipFolder = async (folderHash: FolderHash) => {
  const { folder, hash } = folderHash;
  const path = zipPath(folderHash);
  const output = fs.createWriteStream(path);
  const archive = archiver('zip', { zlib: { level: 9 } }); // Sets the compression level.

  updateZipQueue(folderHash, { status: 'Queued', hash });

  const onError = (err: unknown) => {
    log('error', '🗜️ ZIP ERROR: ' + String(err));
    updateZipQueue(folderHash, { status: 'Error' });
  };
  archive.pipe(output);
  log('info', '🗜️ Creating ZIP at path: ' + path);

  // output.on('close', function () {
  //   logger('🗜️ ZIP Done: ' + path + ' ' + archive.pointer() + ' total bytes');
  // });

  archive.on('warning', onError);

  archive.on('error', function (err) {
    onError(err);
    throw err;
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

  const folderIds = await allSubfolderIds(folder);

  const files = await db.query.dbFile.findMany({
    columns: { id: true, fileHash: true, relativePath: true, name: true },
    where: and(inArray(dbFile.folderId, folderIds), eq(dbFile.exists, true)),
  });

  if (folder.relativePath == null && folder.id !== 1) {
    throw new Error(
      `Cannot generate ZIP for non-root folder ${folder.id} with missing relativePath`,
    );
  }
  const zipRootRelativePath =
    folder.relativePath == null ? '' : folder.relativePath;

  files.forEach((f) => {
    const name = fullPathMinus(f, zipRootRelativePath); // f.relativePath + sep + f.name,
    archive.file(fullPathForFile(f), { name });
  });

  await archive.finalize();
  log('info', '🗜️ ZIP Completed');
  updateZipQueue(folderHash, { status: 'Complete' });
};

export const zipPath = (folderHash: Pick<FolderHash, 'folder' | 'hash'>) => {
  const path = picrConfig.cachePath + '/zip/' + folderHash.folder.name;
  mkdirSync(path, { recursive: true });
  return `${path}/${folderHash.hash}.zip`;
};
