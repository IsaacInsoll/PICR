import { db } from '../../db/picrDb';
import { dbFolder } from '../../db/models';
import { eq } from 'drizzle-orm';

export const setHeroImage = async (heroImageId: number, folderId: number) => {
  return db
    .update(dbFolder)
    .set({ heroImageId: heroImageId, updatedAt: new Date() })
    .where(eq(dbFolder.id, folderId));
};
