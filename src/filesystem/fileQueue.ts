import { addFile } from './events/addFile';
import { addFolder } from './events/addFolder';
import { removeFolder } from './events/removeFolder';
import { Presets, SingleBar } from 'cli-progress';

type QueueAction = 'addDir' | 'unlinkDir' | 'add';

const progressBarOptions = {}; //{ noTTYOutput: true, notTTYSchedule: 500 };
const queueProgressBar = new SingleBar(
  progressBarOptions,
  Presets.shades_classic,
);

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
  queueProgressBar.start(queueTotal, queueDone);

  // console.log(
  //   `${queueCount} : ${priority ? 'Fast' : ''}Queued ${action} on ${filePath}`,
  // );
};

const processQueue = async (action: QueueAction, filePath: string) => {
  if (action == 'addDir') {
    await addFolder(filePath);
  }
  if (action == 'unlinkDir') {
    await removeFolder(filePath);
  }
  if (action == 'add') {
    await addFile(filePath);
  }
  queueDone++;
  queueProgressBar.update(queueDone);
  if (queueDone == queueTotal) queueProgressBar.stop();
};
