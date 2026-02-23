import type { CustomJwtPayload } from '../types/CustomJwtPayload.js';
import type { UserFields } from '../db/picrDb.js';
import { db } from '../db/picrDb.js';
import { eq } from 'drizzle-orm';
import { dbUser } from '../db/models/dbUser.js';

export const getUserFromUUID = async (
  context: CustomJwtPayload,
): Promise<UserFields | undefined> => {
  if (context.uuid && context.uuid !== '') {
    const user = await db.query.dbUser.findFirst({
      where: eq(dbUser.uuid, context.uuid),
    });
    //todo: check expiry dates etc
    if (user && user.enabled && !user.deleted) {
      return user;
    }
  }
};
