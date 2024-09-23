import chokidar from 'chokidar';
import { directoryPath, relativePath } from './fileManager';
import { addToQueue } from './fileQueue';
import { log } from '../logger';
import { picrConfig } from '../server';
import File from '../models/File';
import Folder from '../models/Folder';
import { Op } from 'sequelize';

export const fileWatcher = async () => {
  log(
    'info',
    '👀 Now watching: ' +
      directoryPath +
      (picrConfig.usePolling ? ' with POLLING' : ''),
    true,
  );
  const intervalMultiplier = picrConfig.pollingInterval; // multiply default interval values by this

  //update all files to 'not exist' then set as exist when we find them
  await File.update({ exists: false }, { where: {} });
  await Folder.update(
    { exists: false },
    { where: { parentId: { [Op.ne]: null } } }, //don't set Home (root) to not exist
  );

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
      log('info', '➕ ' + path);
      addToQueue('add', { path });
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
