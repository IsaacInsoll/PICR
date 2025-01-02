import { FolderHash, zipFolder, zipPath } from './zip';
import FolderModel from '../db/FolderModel';
import { existsSync } from 'node:fs';
import { Task } from '../../graphql-types';

interface ZipQueueItem {
  folder: FolderModel;
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
    console.log('in progress');
    return;
  }
  //check if file exists and 'instant finish' if it already exists
  const zPath = zipPath(folderHash);
  if (existsSync(zPath)) {
    console.log('Returning existing ZIP file 🔥');
    zipQueue[folderHash.key] = {
      status: 'Complete',
      folder: folderHash.folder,
    };
  } else {
    console.log('queuing');
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

export const queueZipTaskStatus = (folderIds: string[] | null): Task[] => {
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
  console.log('starting ZipInProgress');

  let inProgress = false;

  Object.keys(zipQueue).forEach((k) => {
    const q = zipQueue[k];
    console.log([
      q.hash,
      folderHash.hash,
      q.folder.id,
      folderHash.folder.id,
      q.status,
    ]);
    if (q.hash == folderHash.hash && q.folder.id == folderHash.folder.id) {
      if (q.status != 'Complete') {
        console.log('allegedly currently zipping');
        inProgress = true;
      } else {
        console.log('deleting zipQueue k');
        // delete zipQueue[k];
        inProgress = false;
      }
    }
  });
  return inProgress;
};
