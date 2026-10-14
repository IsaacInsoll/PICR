import type { FolderHash } from './zip.js';
import { zipFolder, zipPath } from './zip.js';
import { existsSync } from 'node:fs';
import type { Task } from '@shared/gql/graphql.js';
import type { FolderFields } from '../db/picrDb.js';
import { log } from '../logger.js';

interface ZipQueueItem {
  folder: FolderFields;
  status: 'Queued' | 'In Progress' | 'Complete' | 'Error';
  //only relevant if status=inprogress
  filesDone?: number;
  filesTotal?: number;
  errorCode?: string;
}

const zipQueue = new Map<string, ZipQueueItem>();
const pending: FolderHash[] = [];
let running = false;

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
    zipQueue.set(folderHash.key, {
      status: 'Complete',
      folder: folderHash.folder,
    });
  } else {
    log('info', `Queueing ZIP generation for folder ${folderHash.folder.id}`);
    zipQueue.set(folderHash.key, {
      status: 'Queued',
      folder: folderHash.folder,
    });
    pending.push(folderHash);
    void drainZipQueue();
  }
};

// Serialize compression and disk writes on modest self-hosted hardware.
const drainZipQueue = async () => {
  if (running) return;
  running = true;
  try {
    let folderHash: FolderHash | undefined;
    while ((folderHash = pending.shift())) {
      updateZipQueue(folderHash, { status: 'In Progress' });
      try {
        await zipFolder(folderHash);
        updateZipQueue(folderHash, { status: 'Complete' });
      } catch (error) {
        const errorCode = zipErrorCode(error);
        updateZipQueue(folderHash, { status: 'Error', errorCode });
        log(
          'error',
          `🗜️ ZIP failed for folder ${folderHash.folder.id} (${folderHash.hash}) [${errorCode}]: ${String(error)}`,
        );
      }
    }
  } finally {
    running = false;
  }
};

export const zipErrorCode = (error: unknown): string => {
  const code =
    error instanceof Error && 'code' in error ? error.code : undefined;
  if (code === 'ENOSPC' || code === 'EDQUOT') return 'NO_SPACE';
  if (code === 'EACCES' || code === 'EPERM' || code === 'EROFS')
    return 'PERMISSION_DENIED';
  if (code === 'ENOENT') return 'FILE_MISSING';
  return 'ZIP_FAILED';
};

export const updateZipQueue = (
  folderHash: FolderHash,
  item: Partial<ZipQueueItem>,
) => {
  const current = zipQueue.get(folderHash.key);
  if (!current) throw new Error(`ZIP task ${folderHash.key} was not queued`);
  zipQueue.set(folderHash.key, { ...current, ...item });
};

export const queueZipTaskStatus = (folderIds: number[] | null): Task[] => {
  const list: Task[] = [];
  zipQueue.forEach((q, k) => {
    // if (q.status === 'Complete') return; // don't show completed items
    if (folderIds && !folderIds.includes(q.folder.id)) return;
    list.push({
      name: 'Zip ' + q.folder.name,
      step: q.filesDone,
      totalSteps: q.filesTotal,
      status: q.status,
      errorCode: q.errorCode,
      id: k,
    });
  });
  return list;
};

export const zipInProgress = (
  folderHash: Pick<FolderHash, 'hash' | 'folder'>,
) => {
  const status = zipQueue.get(folderHash.folder.id + folderHash.hash)?.status;
  return status === 'Queued' || status === 'In Progress';
};
