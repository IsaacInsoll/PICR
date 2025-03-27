import { db, dbFolderForId, FolderFields } from '../db/picrDb';
import { dbFolder } from '../db/models';
import { and, asc, eq, like, or } from 'drizzle-orm';

// Recursively find all subfolders
// NOTE: no permissions done here, if you can see parent you can see the children
export const allSubfolders = async (folderId: number) => {
  const f = await dbFolderForId(folderId);
  if (!f?.relativePath) {
    //root folder
    return db.query.dbFolder.findMany({
      where: eq(dbFolder.exists, true),
    });
  }

  return db.query.dbFolder.findMany({
    where: and(
      eq(dbFolder.exists, true),
      or(
        eq(dbFolder.relativePath, f.relativePath),
        like(dbFolder.relativePath, f.relativePath + '/%'),
      ),
    ),
    orderBy: asc(dbFolder.name),
  });
};

// Recursively find all subfolder ids
export const allSubfolderIds = async (
  folder: FolderFields,
): Promise<number[]> => {
  const folders = await allSubfolders(folder.id);
  return folders.map((f) => f.id);
};
