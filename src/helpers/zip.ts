import Folder from '../models/Folder';
import File from '../models/File';
import { AllChildFolderIds } from '../auth/folderUtils';
import crypto from 'crypto';
import fs from 'fs';
import archiver from 'archiver';
import { mkdirSync } from 'node:fs';
import { fullPath } from '../filesystem/fileManager';
import { updateZipQueue } from './zipQueue';
import { logger } from '../logger';

export interface FolderHash {
  folder?: Folder;
  hash: string;
  key: string; //folderId+key
}

// Hash FolderIDs + FileHashes, used for determining 'uniqueness' for generating zip files
export const hashFolderContents = async (
  folder: Folder,
): Promise<FolderHash> => {
  const folderIds = await AllChildFolderIds(folder);
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
  const { folder } = folderHash;
  const path = zipPath(folderHash);
  const output = fs.createWriteStream(path);
  const archive = archiver('zip', { zlib: { level: 9 } }); // Sets the compression level.

  const onError = (err) => {
    console.log('🗜️ ZIP ERROR: ', err);
    updateZipQueue(folderHash, { status: 'Error' });
  };
  archive.pipe(output);
  logger('🗜️ Creating ZIP at path: ' + path);

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

  const folderIds = await AllChildFolderIds(folder);
  const files = await File.findAll({
    where: { folderId: folderIds },
    attributes: ['id', 'fileHash', 'relativePath', 'name'],
  });
  files.forEach((f) => {
    const name = f.name; // f.relativePath + sep + f.name,
    archive.file(f.fullPath(), { name });
  });

  await archive.finalize();
  logger('🗜️ ZIP Completed');
  updateZipQueue(folderHash, { status: 'Complete' });
};

export const zipPath = (folderHash: FolderHash) => {
  const path = process.cwd() + '/cache/zip/' + folderHash.folder.name;
  mkdirSync(path, { recursive: true });
  return `${path}/${folderHash.hash}.zip`;
};
