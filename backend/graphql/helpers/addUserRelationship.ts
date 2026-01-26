import { userToJSON } from './userToJSON.js';
import { db } from '../../db/picrDb.js';
import { dbUser } from '../../db/models/index.js';
import { inArray } from 'drizzle-orm';

type UserRelationship = { userId: number | null }[];

// Takes a list of objects with `userId` relationship and adds *BASIC* user details to each object
export const addUserRelationship = async (
  list: UserRelationship,
): Promise<UserRelationship> => {
  const ids = list
    .map((b) => b.userId)
    .filter((v, i, a) => a.indexOf(v) === i)
    .filter((x) => x != null);
  if (ids.length == 0) return list;

  const users = await db.query.dbUser.findMany({
    where: inArray(dbUser.id, ids),
  });
  return list.map((obj) => {
    const u = users.find((f) => f.id == obj.userId);
    if (!u) return obj;
    const user = userToJSON(u);
    const userLimitedDetails = {
      id: user.id,
      name: u.deleted ? '[Deleted User]' : user.name,
      gravatar: user.gravatar,
      deleted: u.deleted,
    };
    return { ...obj, user: userLimitedDetails };
  });
};
