import { db } from '../../db/picrDb.js';
import { dbFolder } from '../../db/models/index.js';
import { eq } from 'drizzle-orm';

export const setHeroImage = async (heroImageId: number, folderId: number) => {
  return db
    .update(dbFolder)
    .set({ heroImageId: heroImageId, updatedAt: new Date() })
    .where(eq(dbFolder.id, folderId));
};
