import Folder from '../models/Folder';
import File from '../models/File';
import { allChildFolderIds } from './allChildFolderIds';
import crypto from 'crypto';
import fs from 'fs';
import archiver from 'archiver';
import { mkdirSync } from 'node:fs';
import { updateZipQueue } from './zipQueue';
import { log } from '../logger';
import { picrConfig } from '../config/picrConfig';

export interface FolderHash {
  folder?: Folder;
  hash: string;
  key: string; //folderId+key
}

// Hash FolderIDs + FileHashes, used for determining 'uniqueness' for generating zip files
export const hashFolderContents = async (
  folder: Folder,
): Promise<FolderHash> => {
  const folderIds = await allChildFolderIds(folder);
  const files = await File.findAll({
    where: { folderId: folderIds },
    attributes: ['id', 'fileHash'],
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

  const onError = (err) => {
    console.log('🗜️ ZIP ERROR: ', err);
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

  const folderIds = await allChildFolderIds(folder);
  const files = await File.findAll({
    where: { folderId: folderIds },
    attributes: ['id', 'fileHash', 'relativePath', 'name'],
  });
  files.forEach((f) => {
    const name = f.fullPathMinus(folder.relativePath); // f.relativePath + sep + f.name,
    archive.file(f.fullPath(), { name });
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
