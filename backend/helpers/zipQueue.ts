import type { FolderHash } from './zip.js';
import { zipFolder, zipPath } from './zip.js';
import { existsSync } from 'node:fs';
import type { Task } from '../../shared/gql/graphql.js';
import type { FolderFields } from '../db/picrDb.js';
import { log } from '../logger.js';

interface ZipQueueItem {
  folder: FolderFields;
  status: 'Queued' | 'In Progress' | 'Complete' | 'Error';
  hash?: string;
  //only relevant if status=inprogress
  filesDone?: number;
  filesTotal?: number;
  bytesDone?: number;
  bytesTotal?: number;
}

const zipQueue: { [key: string]: ZipQueueItem } = {};

export const addToZipQueue = (folderHash: FolderHash) => {
  // already in progress (maybe a double tap of download button?)
  if (zipInProgress(folderHash)) {
    log('info', `ZIP already in progress for folder ${folderHash.folder.id}`);
    return;
  }
  //check if file exists and 'instant finish' if it already exists
  const zPath = zipPath(folderHash);
  if (existsSync(zPath)) {
    log(
      'info',
      `Returning existing ZIP file for folder ${folderHash.folder.id}`,
    );
    zipQueue[folderHash.key] = {
      status: 'Complete',
      folder: folderHash.folder,
    };
  } else {
    log('info', `Queueing ZIP generation for folder ${folderHash.folder.id}`);
    zipQueue[folderHash.key] = {
      status: 'Queued',
      folder: folderHash.folder,
    };
    zipFolder(folderHash);
  }
};

export const updateZipQueue = (
  folderHash: FolderHash,
  item: Partial<ZipQueueItem>,
) => {
  zipQueue[folderHash.key] = { ...zipQueue[folderHash.key], ...item };
};

export const queueZipTaskStatus = (folderIds: number[] | null): Task[] => {
  const list: Task[] = [];
  Object.keys(zipQueue).map((k) => {
    const q = zipQueue[k];
    // if (q.status === 'Complete') return; // don't show completed items
    if (folderIds && !folderIds.includes(q.folder.id)) return;
    list.push({
      name: 'Zip ' + q.folder.name,
      step: q.filesDone,
      totalSteps: q.filesTotal,
      status: q.status,
      id: k,
    });
  });
  return list;
};

export const zipInProgress = (
  folderHash: Pick<FolderHash, 'hash' | 'folder'>,
) => {
  // we don't know key as this could be a previous download or something
  // const q = zipQueue[folderHash.key];
  // return !q || q.status == 'Complete';
  // Developer debugging:
  // log('debug', 'Starting zipInProgress check');

  let inProgress = false;

  Object.keys(zipQueue).forEach((k) => {
    const q = zipQueue[k];
    // Developer debugging:
    // log(
    //   'debug',
    //   `zipInProgress item hash=${String(q.hash)} targetHash=${folderHash.hash} folder=${q.folder.id} targetFolder=${folderHash.folder.id} status=${q.status}`,
    // );
    if (q.hash == folderHash.hash && q.folder.id == folderHash.folder.id) {
      if (q.status != 'Complete') {
        // Developer debugging:
        // log('debug', `ZIP currently in progress for folder ${q.folder.id}`);
        inProgress = true;
      } else {
        // Developer debugging:
        // log('debug', `ZIP queue item already complete for folder ${q.folder.id}`);
        // delete zipQueue[k];
        inProgress = false;
      }
    }
  });
  return inProgress;
};
