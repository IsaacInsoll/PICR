import { CustomJwtPayload } from '../types/CustomJwtPayload.js';
import { db, UserFields } from '../db/picrDb.js';
import { eq } from 'drizzle-orm';
import { dbUser } from '../db/models/dbUser.js';

export const getUserFromUUID = async (
  context: CustomJwtPayload,
): Promise<UserFields | undefined> => {
  const hasUUID = !!context.uuid && context.uuid !== '';
  if (hasUUID) {
    const user = await db.query.dbUser.findFirst({
      where: eq(dbUser.uuid, context.uuid!),
    });
    //todo: check expiry dates etc
    if (user && user.enabled) {
      return user;
    }
  }
};
