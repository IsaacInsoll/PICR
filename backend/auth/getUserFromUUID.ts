import { CustomJwtPayload } from '../types/CustomJwtPayload';
import { db, UserFields } from '../db/picrDb';
import { eq } from 'drizzle-orm';
import { dbUser } from '../db/models';

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
