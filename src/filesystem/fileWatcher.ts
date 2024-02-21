import chokidar from 'chokidar';
import { directoryPath, relativePath } from './fileManager';
import { addFolder } from './events/addFolder';
import { removeFolder } from './events/removeFolder';

export const fileWatcher = () => {
  console.log('👀 Now watching: ' + directoryPath);
  let initComplete = false;
  const watcher = chokidar.watch(directoryPath, {
    ignored: /^\./,
    persistent: true,
    awaitWriteFinish: true,
  });

  const log = (message: string) => {
    // if (initComplete) {
    console.log(message);
    // }
  };

  watcher
    .on('add', (path) => {
      log('➕ ' + path);
      //TODO: the following line times out the DB :(
      // addFile(path);
    })
    // .on('change', path => log('✖️ ' + path))
    // .on('unlink', path => log('➖ ' + path))
    .on('error', (error) => console.log('⚠️ Error happened: ' + error))
    .on('addDir', (path) => {
      log(`📁➕ ${relativePath(path)}`);
      addFolder(path);
    })
    .on('unlinkDir', (path) => {
      log(`📁➖ ${relativePath(path)}`);
      removeFolder(path);
    })
    .on('ready', () => {
      initComplete = true;
      console.log('✅ Initial scan complete. Ready for changes');
    });
};
