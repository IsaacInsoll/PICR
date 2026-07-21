import { allSubfolderIds } from '../../helpers/allSubfolders.js';
import type { FileFields, FolderFields } from '../../db/picrDb.js';
import { db, dbFileForId } from '../../db/picrDb.js';
import { and, asc, eq, inArray, ne } from 'drizzle-orm';
import { dbFile, dbFolder } from '../../db/models/index.js';

import { setHeroImage } from '../mutations/setHeroImage.js';

const isFileWithinFolderPath = (
  fileRelativePath: string,
  folderRelativePath?: string | null,
) => {
  if (folderRelativePath == null) return true; // root folder
  return fileRelativePath.startsWith(folderRelativePath);
};

export const heroImageForFolder = async (
  f: FolderFields & { heroImage?: FileFields },
) => {
  // 0. Hero Image already in the query (eg: subFolders with a join)
  if (
    f.heroImage &&
    f.heroImage.exists &&
    isFileWithinFolderPath(f.heroImage.relativePath, f.relativePath) &&
    (await shouldUseStoredHeroImage(f, f.heroImage))
  ) {
    return f.heroImage;
  }
  // 1. Hero Image set for current folder
  const heroImage =
    f.heroImageId && f.heroImageId !== 0
      ? await dbFileForId(f.heroImageId)
      : undefined;
  if (
    heroImage &&
    heroImage.exists &&
    isFileWithinFolderPath(heroImage.relativePath, f.relativePath) &&
    (await shouldUseStoredHeroImage(f, heroImage))
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
  // 3. First video in this folder
  const firstVideo = await db.query.dbFile.findFirst({
    where: and(
      eq(dbFile.folderId, f.id),
      eq(dbFile.type, 'Video'),
      eq(dbFile.exists, true),
    ),
    orderBy: asc(dbFile.name),
  });
  if (firstVideo) {
    await setHeroImage(firstVideo.id, f.id);
    return firstVideo;
  }
  // 4. Image hero in direct subfolder
  const subFolder = await heroImageForSubFolder([f.id], 'Image');
  if (subFolder) {
    await setHeroImage(subFolder.id, f.id);
    return subFolder;
  }

  // 5. First image in any subfolder
  const subFolderIds = await allSubfolderIds(f);
  const s = await heroImageForSubFolder(subFolderIds, 'Image');
  if (s) {
    await setHeroImage(s.id, f.id);
    return s;
  }

  // 6. All subfolders, image-preferring
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

  const videoSubFolder = await heroImageForSubFolder([f.id], 'Video');
  if (videoSubFolder) {
    await setHeroImage(videoSubFolder.id, f.id);
    return videoSubFolder;
  }

  const nestedVideoSubFolder = await heroImageForSubFolder(
    subFolderIds,
    'Video',
  );
  if (nestedVideoSubFolder) {
    await setHeroImage(nestedVideoSubFolder.id, f.id);
    return nestedVideoSubFolder;
  }

  const allVideos = await db.query.dbFile.findFirst({
    where: and(
      inArray(dbFile.folderId, subFolderIds),
      eq(dbFile.type, 'Video'),
      eq(dbFile.exists, true),
    ),
    orderBy: asc(dbFile.name),
  });
  if (allVideos) {
    await setHeroImage(allVideos.id, f.id);
    return allVideos;
  }
};

const shouldUseStoredHeroImage = async (
  folder: FolderFields,
  file: FileFields,
): Promise<boolean> => {
  if (file.type === 'Image') return true;
  if (file.type !== 'Video') return false;
  if (file.folderId === folder.id) return true;
  return !(await folderHasImageCandidate(folder));
};

const folderHasImageCandidate = async (
  folder: FolderFields,
): Promise<boolean> => {
  const folderImage = await db.query.dbFile.findFirst({
    where: and(
      eq(dbFile.folderId, folder.id),
      eq(dbFile.type, 'Image'),
      eq(dbFile.exists, true),
    ),
  });
  if (folderImage) return true;

  const subFolderIds = await allSubfolderIds(folder);
  if (subFolderIds.length === 0) return false;

  const nestedImage = await db.query.dbFile.findFirst({
    where: and(
      inArray(dbFile.folderId, subFolderIds),
      eq(dbFile.type, 'Image'),
      eq(dbFile.exists, true),
    ),
  });
  return Boolean(nestedImage);
};

const heroImageForSubFolder = async (
  parentIds: number[],
  type: Extract<FileFields['type'], 'Image' | 'Video'>,
) => {
  const subFolders = await db.query.dbFolder.findMany({
    where: and(
      inArray(dbFolder.parentId, parentIds),
      eq(dbFolder.exists, true),
      ne(dbFolder.heroImageId, 0),
    ),
    orderBy: asc(dbFolder.name),
    with: { heroImage: true },
  });
  const subFolder = subFolders.find(
    (candidate) =>
      candidate.heroImage?.exists && candidate.heroImage.type === type,
  );
  return subFolder?.heroImage;
};
