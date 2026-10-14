import crypto from 'crypto';
import { join } from 'node:path';
import { writeZip } from './writeZip.js';
import { updateZipQueue } from './zipQueue.js';
import { log } from '../logger.js';
import { picrConfig } from '../config/picrConfig.js';
import { allSubfolderIds } from './allSubfolders.js';
import { fullPathForFile, fullPathMinus } from '../filesystem/fileManager.js';
import { and, asc, eq, inArray } from 'drizzle-orm';
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
  const folderIds = (await allSubfolderIds(folder)).sort((a, b) => a - b);

  const files = await db.query.dbFile.findMany({
    columns: { id: true, fileHash: true },
    orderBy: asc(dbFile.id),
    where: and(inArray(dbFile.folderId, folderIds), eq(dbFile.exists, true)),
  });

  const hash = crypto.createHash('sha256');
  // Also change the public download URL so browser/proxy caches cannot reuse
  // a legacy archive that was served with immutable caching.
  hash.update('zip-v2:');
  hash.update(files.map((f) => f.fileHash).join(',') + folderIds.join(','));
  const h = hash.digest('hex');
  return { hash: h, folder, key: folder.id + h };
};

export const zipFolder = async (folderHash: FolderHash) => {
  const { folder } = folderHash;
  const path = zipPath(folderHash);

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

  updateZipQueue(folderHash, { filesDone: 0, filesTotal: files.length });
  log(
    'info',
    `🗜️ Creating ZIP for folder ${folder.id}: ${files.length} files at ${path}`,
  );
  await writeZip(
    path,
    files.map((file) => ({
      path: fullPathForFile(file),
      name: fullPathMinus(file, zipRootRelativePath),
    })),
    (filesDone) => updateZipQueue(folderHash, { filesDone }),
  );
  log(
    'info',
    `🗜️ ZIP completed for folder ${folder.id}: ${files.length} files`,
  );
};

export const zipPath = (folderHash: Pick<FolderHash, 'folder' | 'hash'>) => {
  // Old archives may have been published before their write finished. Start a
  // new namespace rather than trusting potentially truncated legacy files.
  return join(
    picrConfig.cachePath,
    'zip',
    'v2',
    String(folderHash.folder.id),
    `${folderHash.hash}.zip`,
  );
};
