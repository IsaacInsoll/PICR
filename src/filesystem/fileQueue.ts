import { addFile } from './events/addFile';
import { addFolder } from './events/addFolder';
import { removeFolder } from './events/removeFolder';

type QueueAction = 'addDir' | 'unlinkDir' | 'add';

let queue = null;
let queueCount = 0;

export const addToQueue = (
  action: QueueAction,
  filePath: string,
  priority?: boolean,
) => {
  queueCount++;
  if (queue) {
    if (priority) {
      queue = processQueue(action, filePath).then(queue);
    } else {
      queue = queue.then(() => processQueue(action, filePath));
    }
  } else {
    queue = addFile(filePath);
  }
  console.log(
    `${queueCount} : ${priority ? 'Fast' : ''}Queued ${action} on ${filePath}`,
  );
};

const processQueue = (action: QueueAction, filePath: string) => {
  queueCount--;
  console.log('QC: ' + queueCount);
  if (action == 'addDir') {
    return addFolder(filePath);
  }
  if (action == 'unlinkDir') {
    return removeFolder(filePath);
  }
  if (action == 'add') {
    return addFile(filePath);
  }
};
