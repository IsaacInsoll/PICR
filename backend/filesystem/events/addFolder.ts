import { folderList, pathSplit, relativePath } from '../fileManager';
import FolderModel from '../../db/FolderModel';
import { updateFolderHash } from './updateFolderHash';
import { log } from '../../logger';
import { sep } from 'path';

let rootFolder: FolderModel | null = null;

export const setupRootFolder = async () => {
  // const totalFolders = await Folder.count();
  const [root] = await FolderModel.findOrCreate({
    where: { parentId: null },
    defaults: { name: 'Home', exists: true },
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
    const [newFolder, created] = await FolderModel.findOrCreate({
      where: {
        name: ps[i],
        parentId: f,
        relativePath: p,
      },
      defaults: {
        exists: true,
      },
    });
    if (created) {
      // console.log('created newFolder: ', p, ' based on ', path);
    } else if (!newFolder.exists) {
      // console.log('setting exists for Folder: ', p);
      newFolder.exists = true;
      await newFolder.save();
    }
    folderList[p] = newFolder.id; // for caching
    updateFolderHash(newFolder);
    f = newFolder.id;
    log('info', `📁➕ ${relativePath(path)}`);
  }
  // console.log('finished addFolder: ' + path);

  return f;
};
