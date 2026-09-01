import { existsSync } from 'node:fs';
import { and, asc, count, gt, inArray, isNull, or, eq, sql } from 'drizzle-orm';
import { db } from '../db/picrDb.js';
import { dbFile } from '../db/models/index.js';
import type { FileFields } from '../db/picrDb.js';
import { fullPathForFile } from '../filesystem/fileManager.js';
import { ensureDecodedImage } from '../media/ensureDecodedImage.js';
import { getImageMetadataAndDimensions } from '../media/getImageMetadata.js';
import { getVideoMetadata } from '../media/getVideoMetadata.js';
import { log } from '../logger.js';
import { IMAGE_DIMENSION_BACKFILL_TASK_ID } from '@shared/tasks/mediaTaskIds.js';
import { withPostBootMaintenanceTask } from './postBootMaintenanceStatus.js';

const IMAGE_DIMENSION_BACKFILL_BATCH_SIZE = 250;

// Images and videos both store their oriented frame size in imageWidth/
// imageHeight, matching the existing imageRatio convention where "image*"
// describes the visual frame of any media type.
const BACKFILL_MEDIA_TYPES = ['Image', 'Video'] as const;

interface BackfillTotals {
  backfilled: number;
  failed: number;
  skippedMissing: number;
}

type BackfillMediaFile = Pick<
  FileFields,
  'fileHash' | 'id' | 'name' | 'relativePath' | 'type'
>;

interface BackfillDimensionUpdate {
  imageWidth: number;
  imageHeight: number;
  imageRatio: number;
  metadata: string;
  duration?: number | null;
}

export const backfillImageDimensions = async (): Promise<BackfillTotals> => {
  const startedAt = Date.now();
  const totals: BackfillTotals = {
    backfilled: 0,
    failed: 0,
    skippedMissing: 0,
  };
  const totalFiles = await countMediaMissingDimensions();

  if (totalFiles === 0) return totals;

  log(
    'info',
    `🖼️  PICR Maintenance: backfilling dimensions for ${totalFiles} media row(s)`,
    true,
  );

  await withPostBootMaintenanceTask(
    {
      id: IMAGE_DIMENSION_BACKFILL_TASK_ID,
      name: 'Updating media dimensions',
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
    `🖼️  PICR Maintenance complete: ${totals.backfilled} media row(s) backfilled in ${elapsedSeconds(startedAt)} seconds, ${totals.failed} failed, ${totals.skippedMissing} missing source file(s) skipped`,
    true,
  );

  return totals;
};

const elapsedSeconds = (startedAt: number): string =>
  ((Date.now() - startedAt) / 1000).toFixed(2);

const countMediaMissingDimensions = async (): Promise<number> => {
  const [result] = await db
    .select({ count: count() })
    .from(dbFile)
    .where(mediaMissingDimensionsWhere());
  return result.count;
};

const imageDimensionBackfillBatch = async (
  afterId: number | undefined,
): Promise<BackfillMediaFile[]> =>
  db.query.dbFile.findMany({
    where: mediaMissingDimensionsWhere(afterId),
    columns: {
      fileHash: true,
      id: true,
      name: true,
      relativePath: true,
      type: true,
    },
    orderBy: [asc(dbFile.id)],
    limit: IMAGE_DIMENSION_BACKFILL_BATCH_SIZE,
  });

// Selection is by missing dimensions, never by a version stamp, so upgrading
// only re-reads what is genuinely incomplete. An install that already
// backfilled its images re-probes nothing but its videos, and no thumbnail
// cache entry is touched either way.
const mediaMissingDimensionsWhere = (afterId?: number) =>
  and(
    eq(dbFile.exists, true),
    inArray(dbFile.type, [...BACKFILL_MEDIA_TYPES]),
    ...(afterId === undefined ? [] : [gt(dbFile.id, afterId)]),
    or(
      isNull(dbFile.imageWidth),
      isNull(dbFile.imageHeight),
      sql<boolean>`${dbFile.imageWidth} <= 0`,
      sql<boolean>`${dbFile.imageHeight} <= 0`,
    ),
  );

const imageDimensionUpdate = async (
  file: BackfillMediaFile,
): Promise<BackfillDimensionUpdate> => {
  const src = await ensureDecodedImage(file);
  const { dimensions, imageRatio, metadata } =
    await getImageMetadataAndDimensions(file, src);
  return {
    imageWidth: dimensions.width,
    imageHeight: dimensions.height,
    imageRatio,
    metadata: JSON.stringify(metadata),
  };
};

// ffprobe is cheap next to a full image decode, and rewriting the summary also
// repairs rotated videos scanned before displayed dimensions were corrected.
const videoDimensionUpdate = async (
  file: BackfillMediaFile,
): Promise<BackfillDimensionUpdate> => {
  const metadata = await getVideoMetadata(file);
  const { Width, Height } = metadata;
  if (!Width || !Height || Width <= 0 || Height <= 0) {
    throw new Error('ffprobe reported no usable video dimensions');
  }
  return {
    imageWidth: Width,
    imageHeight: Height,
    imageRatio: Width / Height,
    metadata: JSON.stringify(metadata),
    duration: metadata.Duration ?? null,
  };
};

const backfillFileDimensions = async (
  file: BackfillMediaFile,
  totals: BackfillTotals,
): Promise<void> => {
  if (!existsSync(fullPathForFile(file))) {
    totals.skippedMissing++;
    return;
  }

  try {
    const update =
      file.type === 'Video'
        ? await videoDimensionUpdate(file)
        : await imageDimensionUpdate(file);
    await db
      .update(dbFile)
      .set({ ...update, updatedAt: new Date() })
      .where(eq(dbFile.id, file.id));
    totals.backfilled++;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log(
      'error',
      `Unable to backfill media dimensions for ${file.name}; leaving the row unchanged: ${message}`,
    );
    totals.failed++;
  }
};
