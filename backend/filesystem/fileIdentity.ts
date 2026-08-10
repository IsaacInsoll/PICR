import { and, eq, inArray, sql } from 'drizzle-orm';
import { db, type FileFields } from '../db/picrDb.js';
import { dbComment, dbFile, dbFolder } from '../db/models/index.js';

export const findBestFileMatch = async ({
  name,
  folderId,
  relativePath,
}: {
  name: string;
  folderId?: number;
  relativePath: string;
}): Promise<FileFields | undefined> => {
  const matches = await db.query.dbFile.findMany({
    where: and(
      eq(dbFile.name, name),
      eq(dbFile.relativePath, relativePath),
      ...(folderId === undefined ? [] : [eq(dbFile.folderId, folderId)]),
    ),
  });
  return matches.toSorted(compareFilesForIdentity)[0];
};

export const compareFilesForIdentity = (
  a: FileFields,
  b: FileFields,
): number => {
  const compareValues = [
    Number(b.exists) - Number(a.exists),
    Number(hasImportedMetadata(b)) - Number(hasImportedMetadata(a)),
    b.totalComments - a.totalComments,
    Number(hasFlag(b)) - Number(hasFlag(a)),
    a.id - b.id,
  ];
  return compareValues.find((value) => value !== 0) ?? 0;
};

export const mergeDuplicateFileRows = async (
  keeper: FileFields,
  duplicateRows: FileFields[],
): Promise<void> => {
  const otherIds = duplicateRows.map((file) => file.id);
  if (otherIds.length === 0) return;

  const mergedFlag =
    (hasFlag(keeper) ? keeper.flag : null) ??
    duplicateRows.find(hasFlag)?.flag ??
    null;
  const mergedRating = Math.max(
    keeper.rating,
    ...duplicateRows.map((file) => file.rating),
  );

  await db.transaction(async (tx) => {
    await tx
      .update(dbComment)
      .set({ fileId: keeper.id, folderId: keeper.folderId })
      .where(inArray(dbComment.fileId, otherIds));
    await tx
      .update(dbFolder)
      .set({ heroImageId: keeper.id })
      .where(inArray(dbFolder.heroImageId, otherIds));
    await tx
      .update(dbFolder)
      .set({ bannerImageId: keeper.id })
      .where(inArray(dbFolder.bannerImageId, otherIds));

    await tx.delete(dbFile).where(inArray(dbFile.id, otherIds));

    const [summary] = await tx
      .select({
        totalComments: sql<number>`count(*) filter (where ${dbComment.systemGenerated} is not true)`,
        latestComment: sql<Date | null>`max(${dbComment.createdAt})`,
      })
      .from(dbComment)
      .where(eq(dbComment.fileId, keeper.id));

    keeper.flag = mergedFlag;
    keeper.rating = mergedRating;
    keeper.totalComments = Number(summary.totalComments);
    keeper.latestComment = summary.latestComment;

    await tx
      .update(dbFile)
      .set({
        flag: keeper.flag,
        latestComment: keeper.latestComment,
        rating: keeper.rating,
        totalComments: keeper.totalComments,
        updatedAt: new Date(),
      })
      .where(eq(dbFile.id, keeper.id));
  });
};

const hasImportedMetadata = (file: FileFields): boolean =>
  Boolean(file.fileHash && file.fileHash !== '') || file.metadata !== null;

const hasFlag = (file: FileFields): boolean =>
  Boolean(file.flag && file.flag !== 'none');
