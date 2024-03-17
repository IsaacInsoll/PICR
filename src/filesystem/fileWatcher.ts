import chokidar from 'chokidar';
import { directoryPath } from './fileManager';
import { addToQueue } from './fileQueue';
import { logger } from '../logger';
import { config } from 'dotenv';

config();

export const fileWatcher = () => {
  logger('👀 Now watching: ' + directoryPath, true);
  let initComplete = false;
  const usePolling = process.env.USE_POLLING == 'true';
  if (usePolling) {
    logger('Watching files with POLLING', true);
  }

  const watcher = chokidar.watch(directoryPath, {
    ignored: /^\./,
    persistent: true,
    awaitWriteFinish: true,
    usePolling,
  });

  watcher
    .on('add', (path) => {
      // log('➕ ' + path);
      //TODO: the following line times out the DB :(
      addToQueue('add', path);
    })
    // .on('change', path => log('✖️ ' + path))
    // .on('unlink', path => log('➖ ' + path))
    .on('error', (error) => console.log('⚠️ Error happened: ' + error))
    .on('addDir', (path) => {
      // log(`📁➕ ${relativePath(path)}`);
      addToQueue('addDir', path, true);
    })
    .on('unlinkDir', (path) => {
      // log(`📁➖ ${relativePath(path)}`);
      addToQueue('unlinkDir', path, true);
    })
    .on('ready', () => {
      initComplete = true;
      logger('✅ Initial scan complete. Ready for changes', true);
    });
};
