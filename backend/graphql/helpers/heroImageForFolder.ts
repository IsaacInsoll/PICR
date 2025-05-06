import { allSubfolderIds } from '../../helpers/allSubfolders.js';
import { db, dbFileForId, FileFields, FolderFields } from '../../db/picrDb.js';
import { and, asc, eq, inArray, ne } from 'drizzle-orm';
import { dbFile, dbFolder } from '../../db/models/index.js';

import { setHeroImage } from '../mutations/setHeroImage.js';

export const heroImageForFolder = async (
  f: FolderFields & { heroImage?: FileFields },
) => {
  // 0. Hero Image already in the query (eg: subFolders with a join)
  if (
    f.heroImage &&
    f.heroImage.exists &&
    f.heroImage.relativePath.startsWith(f.relativePath ?? '')
  ) {
    return f.heroImage;
  }
  // 1. Hero Image set for current folder
  const heroImage =
    f.heroImageId && f.heroImageId != 0
      ? await dbFileForId(f.heroImageId)
      : undefined;
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
  const subFolderIds = await allSubfolderIds(f);
  const s = await heroImageForSubFolder(subFolderIds);
  if (s) {
    await setHeroImage(s.id, f.id);
    return s;
  }

  // 5. All subfolders
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
    with: { heroImage: true },
  });
  if (!subFolder || !!subFolder.heroImage?.exists) return undefined;
  return subFolder.heroImage;
};
