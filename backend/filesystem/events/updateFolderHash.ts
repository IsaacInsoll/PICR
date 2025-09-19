// We can't detect folder renames, so lets compare hash of folder contents to work out if it's a rename?
import { readdirSync } from 'node:fs';
import { fullPath } from '../fileManager.js';
import crypto from 'crypto';
import { log } from '../../logger.js';
import { db, FolderFields } from '../../db/picrDb.js';
import { dbFolder } from '../../db/models/index.js';
import { eq } from 'drizzle-orm';

export const updateFolderHash = (folder: FolderFields) => {
  // I observed that creating a folder on a network volume from a mac temporarily makes a 'New Folder' folder which disappears before we can query it
  try {
    const fileNames = readdirSync(fullPath(folder.relativePath!)).join('#');
    const hash = crypto.createHash('md5').update(fileNames).digest('hex');
    if (folder.folderHash != hash) {
      log(
        'info',
        `#️⃣ Updating Folder hash: ${folder.relativePath} from ${folder.folderHash} to ${hash}`,
      );
      db.update(dbFolder)
        .set({ folderHash: hash })
        .where(eq(dbFolder.id, folder.id));
    }
  } catch (err) {
    console.log('Error doing updateFolderHash');
    console.log(err);
  }
};
