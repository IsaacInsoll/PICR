import { addFile } from './events/addFile.js';
import { addFolder } from './events/addFolder.js';
import { removeFolder } from './events/removeFolder.js';
import { Task } from '../../graphql-types.js';
import { generateAllThumbs } from '../media/generateImageThumbnail.js';
import { log } from '../logger.js';
import { db, dbFileForId } from '../db/picrDb.js';
import { and, count, eq, isNotNull } from 'drizzle-orm';
import { dbFile, dbFolder } from '../db/models/index.js';
import { Stats } from 'node:fs';
import { removeFile } from './events/removeFile.js';

type QueueAction =
  | 'addDir'
  | 'unlinkDir'
  | 'add'
  | 'unlink'
  | 'generateThumbnails'
  | 'initComplete';

let queue: Promise<void> | null = null;
let queueDone = 0;
let queueTotal = 0;
export let initComplete = false;
const timeToInit = Date.now();

interface QueuePayload {
  path?: string;
  generateThumbs?: boolean;
  id?: number;
  stats?: Stats;
}

export const addToQueue = (
  action: QueueAction,
  payload: QueuePayload,
  priority?: boolean,
) => {
  queueTotal++;
  if (queue) {
    if (priority) {
      // @ts-ignore
      queue = processQueue(action, payload).then(queue);
    } else {
      queue = queue.then(() => processQueue(action, payload));
    }
  } else {
    queueTotal = 1;
    queueDone = 0;
    queue = processQueue(action, payload);
  }
};

const processQueue = async (action: QueueAction, payload: QueuePayload) => {
  switch (action) {
    case 'addDir':
      await addFolder(payload.path!, payload.stats);
      break;
    case 'unlinkDir':
      await removeFolder(payload.path!);
      break;
    case 'add':
      await addFile(
        payload.path!,
        payload.generateThumbs ?? false,
        payload.stats,
      );
      break;
    case 'unlink':
      await removeFile(payload.path!);
      break;
    case 'generateThumbnails':
      // lol, we pass an ID to this function, not a path, but it's fine, trust me!
      const file = await dbFileForId(payload.id);
      if (file) await generateAllThumbs(file);
      break;
    case 'initComplete':
      initComplete = true;
      await handleInitComplete();
      break;
  }
  queueDone++;
  if (queueDone == queueTotal) {
    queueDone = 0;
    queueTotal = 0;
  }
};

export const queueTaskStatus = (): null | Task => {
  if (queueDone == queueTotal) return null;
  return {
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
