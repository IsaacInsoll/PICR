// We can't detect folder renames, so lets compare hash of folder contents to work out if it's a rename?
import { readdirSync } from 'node:fs';
import { fullPath } from '../fileManager';
import crypto from 'crypto';
import { log } from '../../logger';
import { DBFolder } from '../../db/picrDb';
import { db } from '../../server';
import { folderTable } from '../../db/models';
import { eq } from 'drizzle-orm';

export const updateFolderHash = async (folder: DBFolder) => {
  const fileNames = readdirSync(fullPath(folder.relativePath ?? '')).join('#');
  const hash = crypto.createHash('md5').update(fileNames).digest('hex');
  if (folder.folderHash != hash) {
    log(
      'info',
      `#️⃣ Updating Folder hash: ${folder.relativePath} from ${folder.folderHash} to ${hash}`,
    );
    await db
      .update(folderTable)
      .set({ folderHash: hash })
      .where(eq(folderTable.id, folder.id));
  }
};
