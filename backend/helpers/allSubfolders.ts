import { db, dbFolderForId, FolderFields } from '../db/picrDb.js';
import { dbFolder } from '../db/models/index.js';
import { and, asc, desc, eq, like, or } from 'drizzle-orm';
import { FoldersSortType } from '../../graphql-types.js';

// Recursively find all subfolders
// NOTE: no permissions done here, if you can see parent you can see the children
export const allSubfolders = async (
  folderId: number,
  sort?: FoldersSortType,
  limit?: number,
) => {
  const orderBy =
    sort == FoldersSortType.FolderLastModified
      ? desc(dbFolder.folderLastModified)
      : asc(dbFolder.name);

  const f = await dbFolderForId(folderId);
  if (!f?.relativePath) {
    //root folder
    return db.query.dbFolder.findMany({
      where: eq(dbFolder.exists, true),
      orderBy,
      limit,
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
    orderBy,
    limit,
  });
};

// Recursively find all subfolder ids
export const allSubfolderIds = async (
  folder: FolderFields,
): Promise<number[]> => {
  const folders = await allSubfolders(folder.id);
  return folders.map((f) => f.id);
};
