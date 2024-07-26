import { folderList, pathSplit, relativePath } from '../fileManager';
import Folder from '../../models/Folder';
import { updateFolderHash } from './updateFolderHash';
import { logger } from '../../logger';
import { sep } from 'path';

let rootFolder: Folder | null = null;

export const setupRootFolder = async () => {
  // const totalFolders = await Folder.count();
  const [root] = await Folder.findOrCreate({
    where: { parentId: null },
    defaults: { name: 'Home' },
  });
  rootFolder = root;
  return root;
};

export const addFolder = async (path: string) => {
  const relative = relativePath(path);
  const root = rootFolder;
  if (relative === '') return root;

  let f = root.id;
  const ps = pathSplit(path);
  for (let i = 0; i < ps.length; i++) {
    const p = ps.slice(0, i + 1).join(sep);
    const pid = folderList[p];
    // We get a race condition at bootup due to trying to set up all client folders with common parent folders, using '0' as 'saving in progress, please wait
    if (pid && pid !== '0') {
      f = folderList[p];
    } else {
      while (folderList[p] === '0') {
        logger('💤 Sleeping on ' + p + ' for ' + path);
        await new Promise((r) => setTimeout(r, 1000));
      }
      folderList[p] = '0';
      const [newFolder, created] = await Folder.findOrCreate({
        where: {
          name: ps[i],
          parentId: f,
          relativePath: p,
        },
      });
      if (created) {
        console.log('created newFolder: ', p, ' based on ', path);
      }
      folderList[p] = newFolder.id; // for caching
      updateFolderHash(newFolder);
      f = newFolder.id;
    }
    logger(`📁➕ ${relativePath(path)}`);
  }
  return f;
};
