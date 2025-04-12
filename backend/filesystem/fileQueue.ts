import { addFile } from './events/addFile';
import { addFolder } from './events/addFolder';
import { removeFolder } from './events/removeFolder';
import { Task } from '../../graphql-types';
import { generateAllThumbs } from '../media/generateImageThumbnail';
import { log } from '../logger';
import { dbFileForId } from '../db/picrDb';

type QueueAction =
  | 'addDir'
  | 'unlinkDir'
  | 'add'
  | 'generateThumbnails'
  | 'initComplete';

let queue: Promise<void> | null = null;
let queueDone = 0;
let queueTotal = 0;
export let initComplete = false;

interface QueuePayload {
  path?: string;
  generateThumbs?: boolean;
  id?: number;
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
      await addFolder(payload.path!);
      break;
    case 'unlinkDir':
      await removeFolder(payload.path!);
      break;
    case 'add':
      await addFile(payload.path!, payload.generateThumbs ?? false);
      break;
    case 'generateThumbnails':
      // lol, we pass an ID to this function, not a path, but it's fine, trust me!
      const file = await dbFileForId(payload.id);
      if (file) await generateAllThumbs(file);
      break;
    case 'initComplete':
      initComplete = true;
      // I decided to leave them exist=false as 'archived' rather than actual delete
      // await File.destroy({ where: { exists: false } });
      // await Folder.destroy({ where: { exists: false } });
      log('info', '✅ Initial scan complete. Ready for changes', true);
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
