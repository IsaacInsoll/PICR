import { and, eq, gte, or, sql } from 'drizzle-orm';
import { db } from '../db/picrDb.js';
import { dbFile } from '../db/models/index.js';
import { addToQueue } from './fileQueue.js';

export const selectScanThumbnailFileIds = async (
  scanRootPath: string,
  passStartedAt: Date,
  database: Pick<typeof db, 'select'> = db,
): Promise<number[]> => {
  const scope =
    scanRootPath === ''
      ? undefined
      : or(
          eq(dbFile.relativePath, scanRootPath),
          sql<boolean>`starts_with(${dbFile.relativePath}, ${`${scanRootPath}/`})`,
        );
  const files = await database
    .select({ id: dbFile.id })
    .from(dbFile)
    .where(
      and(eq(dbFile.exists, true), gte(dbFile.updatedAt, passStartedAt), scope),
    );

  return files.map((file) => file.id);
};

export const enqueueScanThumbnails = async (
  scanRootPath: string,
  passStartedAt: Date,
): Promise<void> => {
  for (const id of await selectScanThumbnailFileIds(
    scanRootPath,
    passStartedAt,
  )) {
    addToQueue('generateThumbnails', { id }, true);
  }
};
