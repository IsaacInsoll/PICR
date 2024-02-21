// We can't detect folder renames, so lets compare hash of folder contents to work out if it's a rename?
import { Folder } from '../../models/folder';
import { readdirSync } from 'node:fs';
import { fullPath } from '../fileManager';
import crypto from 'crypto';

export const updateFolderHash = (folder: Folder) => {
  const fileNames = readdirSync(fullPath(folder.relativePath)).join('#');
  const hash = crypto.createHash('md5').update(fileNames).digest('hex');
  if (folder.folderHash != hash) {
    console.log(
      `#️⃣ Updating Folder hash: ${folder.relativePath} from ${folder.folderHash} to ${hash}`,
    );
    folder.folderHash = hash;
    folder.save();
  }
};
