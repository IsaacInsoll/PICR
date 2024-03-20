import chokidar from 'chokidar';
import { directoryPath, relativePath } from './fileManager';
import { addToQueue } from './fileQueue';
import { logger } from '../logger';
import { config } from 'dotenv';
import { log } from 'node:util';

config();

export const fileWatcher = () => {
  logger('👀 Now watching: ' + directoryPath, true);
  let initComplete = false;
  const usePolling = process.env.USE_POLLING == 'true';
  const intervalMultiplier = parseInt(process.env.POLLING_INTERVAL) ?? 20; // multiply default interval values by this

  if (usePolling) {
    logger(
      'Watching files with POLLING interval of ' + intervalMultiplier,
      true,
    );
  }

  const watcher = chokidar.watch(directoryPath, {
    ignored: ignored,
    persistent: true,
    awaitWriteFinish: true,
    usePolling,
    interval: 100 * intervalMultiplier,
    binaryInterval: 300 * intervalMultiplier,
  });

  watcher
    .on('add', (path) => {
      logger('➕ ' + path);
      //TODO: the following line times out the DB :(
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

const ignored = /(^\.|\/@eaDir\/|\/\.)/;
// anything in root starting with .
// anything in a folder @eaDir which is a sneaky synology "metadata" folder
// any file/folder starting with a .
