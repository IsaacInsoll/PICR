import { addFile } from './events/addFile.js';
import { addFolder } from './events/addFolder.js';
import { removeFolder } from './events/removeFolder.js';
import { renameFolder } from './events/renameFolder.js';
import type { Task } from '@shared/gql/graphql.js';
import { MEDIA_IMPORT_TASK_ID } from '@shared/tasks/mediaTaskIds.js';
import { generateAllThumbs } from '../media/generateImageThumbnail.js';
import { log } from '../logger.js';
import { db, dbFileForId } from '../db/picrDb.js';
import { and, count, eq, isNotNull } from 'drizzle-orm';
import { dbFile, dbFolder } from '../db/models/index.js';
import type { Stats } from 'node:fs';
import { removeFile } from './events/removeFile.js';

type QueueAction =
  | 'addDir'
  | 'renameDir'
  | 'unlinkDir'
  | 'add'
  | 'unlink'
  | 'generateThumbnails'
  | 'initComplete';

let queueDone = 0;
let queueTotal = 0;
export let initComplete = false;
const timeToInit = Date.now();

interface QueuePayload {
  path?: string;
  generateThumbs?: boolean;
  id?: number;
  stats?: Stats;
  renameFromPath?: string;
}

interface QueueItem {
  action: QueueAction;
  payload: QueuePayload;
  priority: boolean;
  key: string | null;
}

const pendingQueue: QueueItem[] = [];
const queuedItemsByKey = new Map<string, QueueItem>();
let queueProcessing = false;

const requirePayloadPath = (
  payload: QueuePayload,
  key: 'path' | 'renameFromPath',
  action: QueueAction,
): string => {
  const value = payload[key];
  if (!value)
    throw new Error(`Missing "${key}" for fileQueue action "${action}"`);
  return value;
};

export const addToQueue = (
  action: QueueAction,
  payload: QueuePayload,
  priority?: boolean,
) => {
  const key = queueItemKey(action, payload);
  if (key) {
    const existing = queuedItemsByKey.get(key);
    if (existing) {
      existing.payload = payload;
      if (priority) existing.priority = true;
      moveQueueItemToTierTail(existing);
      return;
    }
  }

  queueTotal++;
  const item: QueueItem = {
    action,
    payload,
    priority: priority ?? false,
    key,
  };
  enqueueItem(item);
  if (key) queuedItemsByKey.set(key, item);
  void processQueueItems();
};

const queueItemKey = (
  action: QueueAction,
  payload: QueuePayload,
): string | null => {
  switch (action) {
    case 'generateThumbnails':
      return payload.id === undefined ? null : `${action}:${payload.id}`;
    case 'initComplete':
      return action;
    case 'renameDir':
      return payload.path && payload.renameFromPath
        ? `${action}:${payload.renameFromPath}:${payload.path}`
        : null;
    case 'addDir':
    case 'unlinkDir':
    case 'add':
    case 'unlink':
      return payload.path ? `${action}:${payload.path}` : null;
  }
};

const enqueueItem = (item: QueueItem) => {
  if (!item.priority) {
    pendingQueue.push(item);
    return;
  }

  const insertAt = pendingQueue.findIndex(
    (pendingItem) => !pendingItem.priority,
  );
  if (insertAt === -1) pendingQueue.push(item);
  else pendingQueue.splice(insertAt, 0, item);
};

const moveQueueItemToTierTail = (item: QueueItem) => {
  const currentIndex = pendingQueue.indexOf(item);
  if (currentIndex === -1) return;
  pendingQueue.splice(currentIndex, 1);
  enqueueItem(item);
};

const processQueueItems = async () => {
  if (queueProcessing) return;
  queueProcessing = true;

  try {
    while (pendingQueue.length) {
      const item = pendingQueue.shift();
      if (!item) continue;
      if (item.key) queuedItemsByKey.delete(item.key);
      await runQueueItem(item.action, item.payload);
    }
  } finally {
    queueProcessing = false;
    if (pendingQueue.length) void processQueueItems();
    else if (queueDone === queueTotal) {
      queueDone = 0;
      queueTotal = 0;
    }
  }
};

const runQueueItem = async (action: QueueAction, payload: QueuePayload) => {
  try {
    await processQueue(action, payload);
  } catch (err) {
    log(
      'error',
      `⚠️ fileQueue task "${action}" failed: ${(err as Error).message}`,
    );
  } finally {
    queueDone++;
  }
};

const processQueue = async (action: QueueAction, payload: QueuePayload) => {
  switch (action) {
    case 'addDir':
      await addFolder(
        requirePayloadPath(payload, 'path', action),
        payload.stats,
      );
      break;
    case 'renameDir':
      await renameFolder(
        requirePayloadPath(payload, 'renameFromPath', action),
        requirePayloadPath(payload, 'path', action),
        payload.stats,
      );
      break;
    case 'unlinkDir':
      await removeFolder(requirePayloadPath(payload, 'path', action));
      break;
    case 'add':
      await addFile(
        requirePayloadPath(payload, 'path', action),
        payload.generateThumbs ?? false,
        payload.stats,
        payload.renameFromPath,
      );
      break;
    case 'unlink':
      await removeFile(requirePayloadPath(payload, 'path', action));
      break;
    case 'generateThumbnails': {
      // lol, we pass an ID to this function, not a path, but it's fine, trust me!
      const file = await dbFileForId(payload.id);
      if (file) await generateAllThumbs(file);
      break;
    }
    case 'initComplete':
      markInitComplete();
      await handleInitComplete();
      break;
  }
};

export const markInitComplete = () => {
  initComplete = true;
};

export const queueTaskStatus = (): null | Task => {
  if (queueTotal === 0 || queueDone === queueTotal) return null;
  return {
    id: MEDIA_IMPORT_TASK_ID,
    name: 'Import Files and Generate Thumbnails',
    step: queueDone,
    totalSteps: queueTotal,
  };
};

const handleInitComplete = async (): Promise<void> => {
  // I decided to leave them exist=false as 'archived' rather than actual delete
  const removedFiles = await db
    .select({ count: count() })
    .from(dbFile)
    .where(and(eq(dbFile.exists, true), eq(dbFile.existsRescan, false)));

  const removedFolders = await db
    .select({ count: count() })
    .from(dbFolder)
    .where(and(eq(dbFolder.exists, true), eq(dbFolder.existsRescan, false)));

  const foundFiles = await db
    .select({ count: count() })
    .from(dbFile)
    .where(eq(dbFile.existsRescan, true));

  const foundFolders = await db
    .select({ count: count() })
    .from(dbFolder)
    .where(eq(dbFolder.existsRescan, true));

  await db
    .update(dbFile)
    .set({ exists: false })
    .where(eq(dbFile.existsRescan, false));

  await db
    .update(dbFolder)
    .set({ exists: false })
    .where(and(eq(dbFolder.existsRescan, false), isNotNull(dbFolder.parentId)));

  const bootupTime = (Date.now() - timeToInit) / 1000;

  log(
    'info',
    `✅ Initial scan complete. Found ${foundFolders[0].count} folders and ${foundFiles[0].count} files in ${bootupTime.toFixed(2)} seconds`,
    true,
  );
  if (removedFiles[0].count || removedFolders[0].count) {
    log(
      'info',
      `Unexisted ${removedFiles[0].count} files and ${removedFolders[0].count} folders during boot`,
    );
  }
};
