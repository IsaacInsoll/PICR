import { folderList, pathSplit, relativePath } from '../fileManager';
import { Folder } from '../../models/folder';
import { updateFolderHash } from './updateFolderHash';
import { logger } from '../../logger';

export const addFolder = async (path: string) => {
  const relative = relativePath(path);
  const [root] = await Folder.findOrCreate({
    where: { name: '', parentId: null },
  });
  if (relative === '') {
    return root;
  }
  let f = root;
  const ps = pathSplit(path);
  for (let i = 0; i < ps.length; i++) {
    const p = ps.slice(0, i + 1).join('/');
    const [newFolder] = await Folder.findOrCreate({
      where: {
        name: ps[i],
        parentId: f.id,
        relativePath: p,
      },
    });
    folderList[p] = newFolder.id; // for caching
    // console.log(folderList);
    // if (created) {
    updateFolderHash(newFolder);
    // }
    f = newFolder;
    logger(`📁➕ ${relativePath(path)}`);
  }
  return f;
};
