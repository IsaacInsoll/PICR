import type { CustomJwtPayload } from '../types/CustomJwtPayload.js';
import type { UserFields } from '../db/picrDb.js';
import { db } from '../db/picrDb.js';
import { eq } from 'drizzle-orm';
import { dbUser } from '../db/models/dbUser.js';
import { normalizeGalleryPasscode } from '@shared/auth/galleryPasscode.js';
import { isPublicLinkExpired } from '../helpers/expirationHelpers.js';

export const getUserFromUUID = async (
  context: CustomJwtPayload,
): Promise<UserFields | undefined> => {
  if (context.uuid && context.uuid !== '') {
    const user = await db.query.dbUser.findFirst({
      where: eq(dbUser.uuid, context.uuid),
    });
    if (
      user &&
      user.enabled &&
      !user.deleted &&
      !isPublicLinkExpired(user.expiresAt, new Date())
    ) {
      const requiredPasscode = normalizeGalleryPasscode(user.galleryPasscode);
      if (
        requiredPasscode &&
        normalizeGalleryPasscode(context.galleryPasscode) !== requiredPasscode
      ) {
        return undefined;
      }
      return user;
    }
  }
};
