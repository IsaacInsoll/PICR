import chokidar from 'chokidar';
import { directoryPath, relativePath } from './fileManager';
import { createFolder } from './events/createFolder';
import { deleteFolder } from './events/deleteFolder';

export const fileWatcher = () => {
  console.log('👀 Now watching: ' + directoryPath);
  let initComplete = false;
  const watcher = chokidar.watch(directoryPath, {
    ignored: /^\./,
    persistent: true,
    awaitWriteFinish: true,
  });

  const log = (message: string) => {
    if (initComplete) {
      console.log(message);
    }
  };

  watcher
    // .on('add', path => log('➕ ' + path))
    // .on('change', path => log('✖️ ' + path))
    // .on('unlink', path => log('➖ ' + path))
    .on('error', (error) => console.log('⚠️ Error happened: ' + error))
    .on('addDir', (path) => {
      log(`📁➕ ${relativePath(path)}`);
      createFolder(path);
    })
    .on('unlinkDir', (path) => {
      log(`📁➖ ${relativePath(path)}`);
      deleteFolder(path);
    })
    .on('ready', () => {
      initComplete = true;
      console.log('✅ Initial scan complete. Ready for changes');
    });
};
