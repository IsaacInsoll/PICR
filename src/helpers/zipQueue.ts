import { FolderHash, zipFolder, zipPath } from './zip';
import Folder from '../models/Folder';
import { existsSync } from 'node:fs';
import { Task } from '../../graphql-types';

interface ZipQueueItem {
  folder: Folder;
  status: 'Queued' | 'In Progress' | 'Complete' | 'Error';

  //only relevant if status=inprogress
  filesDone?: number;
  filesTotal?: number;
  bytesDone?: number;
  bytesTotal?: number;
}

const zipQueue: { [key: string]: ZipQueueItem } = {};

export const addToZipQueue = (folderHash: FolderHash) => {
  //check if file exists and 'instant finish' if it already exists
  const zPath = zipPath(folderHash);
  if (existsSync(zPath)) {
    console.log('Returning existing ZIP file 🔥');
    zipQueue[folderHash.key] = {
      status: 'Complete',
      folder: folderHash.folder,
    };
  } else {
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
    if (q.status === 'Complete') return; // don't show completed items
    if (folderIds && !folderIds.includes(q.folder.id)) return;
    list.push({
      name: 'Zip ' + q.folder.name,
      step: q.bytesDone,
      totalSteps: q.bytesTotal,
    });
  });
  return list;
};
