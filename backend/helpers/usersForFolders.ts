import { db, UserFields } from '../db/picrDb';
import { inArray } from 'drizzle-orm';
import { dbUser } from '../db/models';

export const usersForFolders = async (
  folderIds: number[],
): Promise<UserFields[]> => {
  return db.query.dbUser.findMany({
    where: inArray(dbUser.folderId, folderIds),
  });
};
