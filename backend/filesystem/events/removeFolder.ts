import { delay } from '../../helpers/delay';
import { folderList, relativePath } from '../fileManager';
import { log } from '../../logger';
import { db } from '../../server';
import { folderTable } from '../../db/models';
import { eq } from 'drizzle-orm';

export const removeFolder = async (path: string) => {
  // wait 1 sec, then see if a 'matching' folder was added in last 5 seconds, due to fileWatcher not detecting renames
  // don't filter including parentId as it might be a cut/paste from different folder levels???
  await delay(1000);
  const folder = await db.query.folderTable.findFirst({
    where: (f, { eq }) => eq(f.relativePath, relativePath(path)),
  });

  if (folder) {
    const newFolder = await db.query.folderTable.findFirst({
      where: (f, { eq, sql }) =>
        eq(f.folderHash, folder.folderHash) &&
        sql`${folderTable.createdAt} >= NOW() - interval '5' second`,
    });

    if (newFolder) {
      //TODO: Handle folder rename (move data across?)
      log(
        'info',
        `🔀 Appears to be folder Rename from ${folder.relativePath} to ${newFolder.relativePath}`,
      );
    }
    folderList[relativePath(path)] = undefined;

    await db.delete(folderTable).where(eq(folderTable.id, folder.id));
    log('info', `📁➖ ${relativePath(path)}`);
  }
};
