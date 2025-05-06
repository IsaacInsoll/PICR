import { delay } from '../../helpers/delay.js';
import { folderList, relativePath } from '../fileManager.js';
import { log } from '../../logger.js';
import { db } from '../../db/picrDb.js';
import { and, eq, gte } from 'drizzle-orm';
import { dbFolder } from '../../db/models/index.js';

export const removeFolder = async (path: string) => {
  // wait 1 sec, then see if a 'matching' folder was added in last 5 seconds, due to fileWatcher not detecting renames
  // don't filter including parentId as it might be a cut/paste from different folder levels???
  await delay(1000);
  const folder = await db.query.dbFolder.findFirst({
    where: eq(dbFolder.relativePath, relativePath(path)),
  });
  if (!folder) return;
  const newFolder = await db.query.dbFolder.findFirst({
    where: and(
      eq(dbFolder.folderHash, folder.folderHash!),
      gte(dbFolder.createdAt, new Date(Date.now() - 5000)),
    ),
  });

  if (newFolder) {
    //TODO: Handle folder rename (move data across?)
    log(
      'info',
      `🔀 Appears to be folder Rename from ${folder.relativePath} to ${newFolder.relativePath}`,
    );
  }
  folderList[relativePath(path)] = undefined;
  // console.log(folderList);
  await db.delete(dbFolder).where(eq(dbFolder.id, folder.id));
  log('info', `📁➖ ${relativePath(path)}`);
};
