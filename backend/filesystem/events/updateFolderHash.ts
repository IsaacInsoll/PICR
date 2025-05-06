// We can't detect folder renames, so lets compare hash of folder contents to work out if it's a rename?
import { readdirSync } from 'node:fs';
import { fullPath } from '../fileManager.js';
import crypto from 'crypto';
import { log } from '../../logger.js';
import { db, FolderFields } from '../../db/picrDb.js';
import { dbFolder } from '../../db/models/index.js';
import { eq } from 'drizzle-orm';

export const updateFolderHash = (folder: FolderFields) => {
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
};
