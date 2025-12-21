import { basename, dirname } from 'path';
import { relativePath } from '../fileManager.js';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db/picrDb.js';
import { dbFile } from '../../db/models/index.js';

export const removeFile = async (filePath: string) => {
  const props = {
    name: basename(filePath),
    relativePath: relativePath(dirname(filePath)),
  };

  let file = await db.query.dbFile.findFirst({
    where: and(
      eq(dbFile.name, props.name),
      eq(dbFile.relativePath, props.relativePath),
    ),
  });

  if (!file) return;

  await db
    .update(dbFile)
    .set({ exists: false, updatedAt: new Date() })
    .where(eq(dbFile.id, file.id));

  // if (file.type == 'Image' || file.type =='Video') {
  //   deleteAllThumbs(filePath);
  // }
};
