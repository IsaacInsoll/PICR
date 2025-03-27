import { and, asc, eq } from 'drizzle-orm';
import { dbFolder } from '../../db/models';
import { db } from '../../db/picrDb';

export const subFolders = async (parentId: string | number) => {
  return db.query.dbFolder.findMany({
    where: and(eq(dbFolder.parentId, parentId), eq(dbFolder.exists, true)),
    orderBy: asc(dbFolder.name),
  });
};
