import { existsSync } from 'node:fs';
import { and, asc, count, eq, gt, isNull, or, sql } from 'drizzle-orm';
import { db } from '../db/picrDb.js';
import { dbFile } from '../db/models/index.js';
import { fullPathForFile } from '../filesystem/fileManager.js';
import {
  ensureDecodedImage,
  type DecodableImageFile,
} from '../media/ensureDecodedImage.js';
import { getImageMetadataAndDimensions } from '../media/getImageMetadata.js';
import { log } from '../logger.js';
import { IMAGE_DIMENSION_BACKFILL_TASK_ID } from '@shared/tasks/mediaTaskIds.js';
import { withPostBootMaintenanceTask } from './postBootMaintenanceStatus.js';

const IMAGE_DIMENSION_BACKFILL_BATCH_SIZE = 250;

interface BackfillTotals {
  backfilled: number;
  failed: number;
  skippedMissing: number;
}

export const backfillImageDimensions = async (): Promise<BackfillTotals> => {
  const startedAt = Date.now();
  const totals: BackfillTotals = {
    backfilled: 0,
    failed: 0,
    skippedMissing: 0,
  };
  const totalFiles = await countImagesMissingDimensions();

  if (totalFiles === 0) return totals;

  log(
    'info',
    `🖼️  PICR Maintenance: backfilling dimensions for ${totalFiles} image row(s)`,
    true,
  );

  await withPostBootMaintenanceTask(
    {
      id: IMAGE_DIMENSION_BACKFILL_TASK_ID,
      name: 'Updating image dimensions',
      totalSteps: totalFiles,
    },
    async (progress) => {
      let lastSeenId: number | undefined;
      let files = await imageDimensionBackfillBatch(lastSeenId);
      while (files.length > 0) {
        for (const file of files) {
          lastSeenId = file.id;
          await backfillFileDimensions(file, totals);
          progress.incrementStep();
        }
        files = await imageDimensionBackfillBatch(lastSeenId);
      }
    },
  );

  log(
    'info',
    `🖼️  PICR Maintenance complete: ${totals.backfilled} image row(s) backfilled in ${elapsedSeconds(startedAt)} seconds, ${totals.failed} failed, ${totals.skippedMissing} missing source file(s) skipped`,
    true,
  );

  return totals;
};

const elapsedSeconds = (startedAt: number): string =>
  ((Date.now() - startedAt) / 1000).toFixed(2);

const countImagesMissingDimensions = async (): Promise<number> => {
  const [result] = await db
    .select({ count: count() })
    .from(dbFile)
    .where(imagesMissingDimensionsWhere());
  return result.count;
};

const imageDimensionBackfillBatch = async (
  afterId: number | undefined,
): Promise<DecodableImageFile[]> =>
  db.query.dbFile.findMany({
    where: imagesMissingDimensionsWhere(afterId),
    columns: {
      fileHash: true,
      id: true,
      name: true,
      relativePath: true,
    },
    orderBy: [asc(dbFile.id)],
    limit: IMAGE_DIMENSION_BACKFILL_BATCH_SIZE,
  });

const imagesMissingDimensionsWhere = (afterId?: number) =>
  and(
    eq(dbFile.exists, true),
    eq(dbFile.type, 'Image'),
    ...(afterId === undefined ? [] : [gt(dbFile.id, afterId)]),
    or(
      isNull(dbFile.imageWidth),
      isNull(dbFile.imageHeight),
      sql<boolean>`${dbFile.imageWidth} <= 0`,
      sql<boolean>`${dbFile.imageHeight} <= 0`,
    ),
  );

const backfillFileDimensions = async (
  file: DecodableImageFile,
  totals: BackfillTotals,
): Promise<void> => {
  if (!existsSync(fullPathForFile(file))) {
    totals.skippedMissing++;
    return;
  }

  try {
    const src = await ensureDecodedImage(file);
    const { dimensions, imageRatio, metadata } =
      await getImageMetadataAndDimensions(file, src);
    await db
      .update(dbFile)
      .set({
        imageWidth: dimensions.width,
        imageHeight: dimensions.height,
        imageRatio,
        metadata: JSON.stringify(metadata),
        updatedAt: new Date(),
      })
      .where(eq(dbFile.id, file.id));
    totals.backfilled++;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log(
      'error',
      `Unable to backfill image dimensions for ${file.name}; leaving the row unchanged: ${message}`,
    );
    totals.failed++;
  }
};
