import { addFile } from './events/addFile';
import { addFolder } from './events/addFolder';
import { removeFolder } from './events/removeFolder';
import { Task } from '../../graphql-types';
import { generateAllThumbs } from '../helpers/thumbnailGenerator';
import File from '../models/File';

type QueueAction = 'addDir' | 'unlinkDir' | 'add' | 'generateThumbnails';

let queue = null;
let queueDone = 0;
let queueTotal = 0;

export const addToQueue = (
  action: QueueAction,
  filePath: string,
  priority?: boolean,
) => {
  queueTotal++;
  if (queue) {
    if (priority) {
      queue = processQueue(action, filePath).then(queue);
    } else {
      queue = queue.then(() => processQueue(action, filePath));
    }
  } else {
    queueTotal = 1;
    queueDone = 0;
    queue = processQueue(action, filePath);
  }
};

const processQueue = async (action: QueueAction, filePath: string) => {
  switch (action) {
    case 'addDir':
      await addFolder(filePath);
      break;
    case 'unlinkDir':
      await removeFolder(filePath);
      break;
    case 'add':
      await addFile(filePath);
      break;
    case 'generateThumbnails':
      // lol, we pass an ID to this function, not a path, but it's fine, trust me!
      await generateAllThumbs(await File.findByPk(filePath));
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
