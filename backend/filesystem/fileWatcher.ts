import chokidar from 'chokidar';
import { relativePath } from './fileManager';
import { addToQueue, initComplete } from './fileQueue';
import { log } from '../logger';
import FileModel from '../db/sequelize/FileModel';
import FolderModel from '../db/sequelize/FolderModel';
import { Op } from 'sequelize';
import { picrConfig } from '../config/picrConfig';

export const fileWatcher = async (config) => {
  log(
    'info',
    '👀 Now watching: ' +
      picrConfig.mediaPath +
      (config.usePolling ? ' with POLLING' : ''),
    true,
  );
  const intervalMultiplier = config.pollingInterval; // multiply default interval values by this

  //update all files to 'not exist' then set as exist when we find them
  await FileModel.update({ exists: false }, { where: {} });
  await FolderModel.update(
    { exists: false },
    { where: { parentId: { [Op.ne]: null } } }, //don't set Home (root) to not exist
  );

  const watcher = chokidar.watch(picrConfig.mediaPath, {
    ignored: ignored,
    persistent: true,
    awaitWriteFinish: true,
    usePolling: config.usePolling,
    interval: 100 * intervalMultiplier,
    binaryInterval: 300 * intervalMultiplier,
  });

  watcher
    .on('add', (path) => {
      log('info', '➕ ' + path);
      addToQueue('add', { path, generateThumbs: initComplete });
    })
    // .on('change', path => log('✖️ ' + path))
    // .on('unlink', path => log('➖ ' + path))
    .on('error', (error) => console.log('⚠️ Error happened: ' + error))
    .on('addDir', (path) => {
      log('info', `📁➕ ${relativePath(path)}`);
      addToQueue('addDir', { path }, true);
    })
    .on('unlinkDir', (path) => {
      log('info', `📁➖ ${relativePath(path)}`);
      addToQueue('unlinkDir', { path }, true);
    })
    .on('ready', () => {
      addToQueue('initComplete', {});
    });
};

const ignored = /(^\.|\/\.|@eaDir|desktop.ini|Thumbs.db)/;
// anything in root starting with .
// any file/folder starting with a .
// anything in a folder @eaDir which is a sneaky synology "metadata" folder
