import { eq } from 'drizzle-orm';
import { db, dbFolderForId } from '../db/picrDb.js';
import { dbUser } from '../db/models/dbUser.js';
import type { PublicLinkAttempt } from '../types/RequestAuthentication.js';
import { classifyPublicLink, publicLinkPreviewUser } from './publicLinkAuth.js';

export const resolvePublicLinkAttempt = async (
  uuid: string,
  galleryPasscode: string | undefined,
  now: Date,
): Promise<PublicLinkAttempt> => {
  const user = await db.query.dbUser.findFirst({
    where: eq(dbUser.uuid, uuid),
  });
  const outcome = classifyPublicLink(user, galleryPasscode, now);
  return {
    uuid,
    outcome,
    homeFolder: await dbFolderForId(publicLinkPreviewUser(outcome)?.folderId),
  };
};
