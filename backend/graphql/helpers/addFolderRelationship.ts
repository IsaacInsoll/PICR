import { db } from '../../db/picrDb.js';
import { inArray } from 'drizzle-orm';
import { dbFolder } from '../../db/models/index.js';

type FolderRelationship = { folderId: number | null | undefined }[];

// Takes a list of objects with `folderId` relationship and adds the folder details to each object
export const addFolderRelationship = async (
  list: FolderRelationship,
): Promise<FolderRelationship> => {
  const ids: number[] = list
    .map((b) => b.folderId)
    .filter((v): v is number => v != null)
    .filter((v, i, a) => a.indexOf(v) === i);

  if (ids.length == 0) return list;

  const folders = await db.query.dbFolder.findMany({
    where: inArray(dbFolder.id, ids),
  });

  return list.map((obj) => {
    const folder = folders.find((f) => f.id == obj.folderId);
    return { ...obj, folder };
  });
};
