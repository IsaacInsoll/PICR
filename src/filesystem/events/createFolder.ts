import { fullPath, pathSplit, relativePath } from '../fileManager';
import { Folder } from '../../models/folder';
import { readdirSync } from 'node:fs';
import crypto from 'crypto';

export const createFolder = async (path: string) => {
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
    const [newFolder] = await Folder.findOrCreate({
      where: {
        name: ps[i],
        parentId: f.id,
        fullPath: ps.slice(0, i + 1).join('/'),
      },
    });
    // if (created) {
    updateFolderHash(newFolder);
    // }
    f = newFolder;
  }
};

// We can't detect folder renames, so lets compare hash of folder contents to work out if it's a rename?
const updateFolderHash = (folder: Folder) => {
  const fileNames = readdirSync(fullPath(folder.fullPath)).join('#');
  const hash = crypto.createHash('md5').update(fileNames).digest('hex');
  if (folder.folderHash != hash) {
    console.log(
      `#️⃣ Updating Folder hash: ${folder.fullPath} from ${folder.folderHash} to ${hash}`,
    );
    folder.folderHash = hash;
    folder.save();
  }
};
