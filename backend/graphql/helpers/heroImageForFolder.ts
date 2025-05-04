import { allSubfolders } from '../../helpers/allSubfolders';
import { db, dbFileForId, FolderFields } from '../../db/picrDb';
import { and, asc, eq, inArray, ne } from 'drizzle-orm';
import { dbFile, dbFolder } from '../../db/models';

import { setHeroImage } from '../mutations/setHeroImage';

export const heroImageForFolder = async (f: FolderFields) => {
  // 1. Hero Image set for current folder
  const heroImage =
    f.heroImageId != 0 ? await dbFileForId(f.heroImageId) : undefined;
  if (
    heroImage &&
    heroImage.exists &&
    heroImage.relativePath.startsWith(f.relativePath ?? '')
  ) {
    return heroImage;
  }
  // 2. First image in this folder
  const first = await db.query.dbFile.findFirst({
    where: and(
      eq(dbFile.folderId, f.id),
      eq(dbFile.type, 'Image'),
      eq(dbFile.exists, true),
    ),
    orderBy: asc(dbFile.name),
  });
  if (first) {
    await setHeroImage(first.id, f.id);
    return first;
  }
  // 3. Hero image in subfolder
  const subFolder = await heroImageForSubFolder([f.id]);
  if (subFolder) {
    await setHeroImage(subFolder.id, f.id);
    return subFolder;
  }
  // 4. First image in any subfolder
  const allSubFolders = await allSubfolders(f.id);
  const subFolderIds = allSubFolders.map((f) => f.id);
  const s = await heroImageForSubFolder(subFolderIds);
  if (s) return s;
  const allImages = await db.query.dbFile.findFirst({
    where: and(
      inArray(dbFile.folderId, subFolderIds),
      eq(dbFile.type, 'Image'),
      eq(dbFile.exists, true),
    ),
    orderBy: asc(dbFile.name),
  });
  if (allImages) {
    await setHeroImage(allImages.id, f.id);
    return allImages;
  }
};

const heroImageForSubFolder = async (parentIds: number[]) => {
  const subFolder = await db.query.dbFolder.findFirst({
    where: and(
      inArray(dbFolder.parentId, parentIds),
      eq(dbFolder.exists, true),
      ne(dbFolder.heroImageId, 0),
    ),
  });
  if (!subFolder) return undefined;

  const subHeroImage = subFolder
    ? await dbFileForId(subFolder.heroImageId)
    : undefined;
  if (
    subHeroImage &&
    subHeroImage.exists &&
    subHeroImage.folderId == subFolder?.id
  ) {
    return subHeroImage;
  }
};
