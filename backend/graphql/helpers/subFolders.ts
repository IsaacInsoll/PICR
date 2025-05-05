import { and, asc, eq } from 'drizzle-orm';
import { dbFolder } from '../../db/models';
import { db } from '../../db/picrDb';

// only used when querying subfolders on a folder in GQL so we can perf tune here
export const subFolders = async (parentId: number) => {
  const result = db.query.dbFolder.findMany({
    where: and(eq(dbFolder.parentId, parentId), eq(dbFolder.exists, true)),
    orderBy: asc(dbFolder.name),
    with: { heroImage: true },
  });
  return result;
};
