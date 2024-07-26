import chokidar from 'chokidar';
import { directoryPath, relativePath } from './fileManager';
import { addToQueue } from './fileQueue';
import { logger } from '../logger';
import { picrConfig } from '../server';

export const fileWatcher = () => {
  logger(
    '👀 Now watching: ' +
      directoryPath +
      (picrConfig.usePolling ? ' with POLLING' : ''),
    true,
  );
  let initComplete = false;
  const intervalMultiplier = picrConfig.pollingInterval; // multiply default interval values by this

  const watcher = chokidar.watch(directoryPath, {
    ignored: ignored,
    persistent: true,
    awaitWriteFinish: true,
    usePolling: picrConfig.usePolling,
    interval: 100 * intervalMultiplier,
    binaryInterval: 300 * intervalMultiplier,
  });

  watcher
    .on('add', (path) => {
      logger('➕ ' + path);
      addToQueue('add', path);
    })
    // .on('change', path => log('✖️ ' + path))
    // .on('unlink', path => log('➖ ' + path))
    .on('error', (error) => console.log('⚠️ Error happened: ' + error))
    .on('addDir', (path) => {
      logger(`📁➕ ${relativePath(path)}`);
      addToQueue('addDir', path, true);
    })
    .on('unlinkDir', (path) => {
      logger(`📁➖ ${relativePath(path)}`);
      addToQueue('unlinkDir', path, true);
    })
    .on('ready', () => {
      initComplete = true;
      logger('✅ Initial scan complete. Ready for changes', true);
    });
};

const ignored = /(^\.|\/\.|@eaDir)/;
// anything in root starting with .
// any file/folder starting with a .
// anything in a folder @eaDir which is a sneaky synology "metadata" folder
