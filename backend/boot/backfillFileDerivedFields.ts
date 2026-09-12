import {
  and,
  asc,
  count,
  eq,
  gt,
  isNotNull,
  isNull,
  or,
  sql,
} from 'drizzle-orm';
import { db } from '../db/picrDb.js';
import { dbFile } from '../db/models/index.js';
import type { FileFields } from '../db/picrDb.js';
import {
  capturedAtFromMetadata,
  fileSearchFields,
  type FileSearchFields,
} from '../helpers/fileDerivedFields.js';
import { log } from '../logger.js';
import { FILE_DERIVED_FIELDS_BACKFILL_TASK_ID } from '@shared/tasks/mediaTaskIds.js';
import { withPostBootMaintenanceTask } from './postBootMaintenanceStatus.js';

const FILE_DERIVED_FIELDS_BACKFILL_BATCH_SIZE = 500;
const CAPTURE_DATE_JSON_PATTERN = '"DateTimeOriginal"\\s*:\\s*"[^"]+"';
const CAPTURE_DATE_JSON_REGEX = /"DateTimeOriginal"\s*:\s*"[^"]+"/;

export interface FileDerivedFieldsBackfillTotals {
  capturedAtBackfilled: number;
  searchFieldsBackfilled: number;
  malformedCaptureDates: number;
}

type BackfillFile = Pick<
  FileFields,
  | 'capturedAt'
  | 'id'
  | 'metadata'
  | 'name'
  | 'normalizedName'
  | 'normalizedNameSource'
  | 'normalizedRelativePath'
  | 'normalizedRelativePathSource'
  | 'relativePath'
>;

interface PreparedFileDerivedFieldsUpdate {
  capturedAt?: Date;
  id: number;
  malformedCaptureDate: boolean;
  searchFields?: FileSearchFields;
  sourceMetadata: string | null;
  sourceName: string;
  sourceRelativePath: string;
}

export const backfillFileDerivedFields =
  async (): Promise<FileDerivedFieldsBackfillTotals> => {
    const startedAt = Date.now();
    const totals: FileDerivedFieldsBackfillTotals = {
      capturedAtBackfilled: 0,
      searchFieldsBackfilled: 0,
      malformedCaptureDates: 0,
    };

    const searchFiles = await countFilesMissingSearchFields();
    const totalFiles = await countFilesMissingDerivedFields();
    if (totalFiles === 0) return totals;

    if (searchFiles > 0) {
      log(
        'info',
        `🔎 PICR Maintenance: deriving search and capture fields for ${totalFiles} media row(s)`,
        true,
      );
      await withPostBootMaintenanceTask(
        {
          id: FILE_DERIVED_FIELDS_BACKFILL_TASK_ID,
          name: 'Preparing media search',
          totalSteps: totalFiles,
        },
        async (progress) => {
          await backfillFiles(totals, progress.incrementStep);
        },
      );
    } else {
      await backfillFiles(totals);
    }

    if (totals.malformedCaptureDates > 0) {
      log(
        'warn',
        `PICR Maintenance: ${totals.malformedCaptureDates} media row(s) had an invalid DateTimeOriginal value; capturedAt remains unset`,
        true,
      );
    }
    if (totals.searchFieldsBackfilled > 0 || totals.capturedAtBackfilled > 0) {
      log(
        'info',
        `🔎 PICR Maintenance complete: ${totals.searchFieldsBackfilled} search row(s) and ${totals.capturedAtBackfilled} capture date(s) backfilled in ${elapsedSeconds(startedAt)} seconds`,
        true,
      );
    }

    return totals;
  };

const elapsedSeconds = (startedAt: number): string =>
  ((Date.now() - startedAt) / 1000).toFixed(2);

const countFilesMissingSearchFields = async (): Promise<number> => {
  const [result] = await db
    .select({ count: count() })
    .from(dbFile)
    .where(and(eq(dbFile.exists, true), searchFieldsMissingWhere()));
  return result.count;
};

const countFilesMissingDerivedFields = async (): Promise<number> => {
  const [result] = await db
    .select({ count: count() })
    .from(dbFile)
    .where(fileDerivedFieldsMissingWhere());
  return result.count;
};

const fileDerivedFieldsBackfillBatch = async (
  afterId: number | undefined,
): Promise<BackfillFile[]> =>
  db.query.dbFile.findMany({
    where: fileDerivedFieldsMissingWhere(afterId),
    columns: {
      capturedAt: true,
      id: true,
      metadata: true,
      name: true,
      normalizedName: true,
      normalizedNameSource: true,
      normalizedRelativePath: true,
      normalizedRelativePathSource: true,
      relativePath: true,
    },
    orderBy: [asc(dbFile.id)],
    limit: FILE_DERIVED_FIELDS_BACKFILL_BATCH_SIZE,
  });

const searchFieldsMissingWhere = () =>
  or(
    isNull(dbFile.normalizedName),
    isNull(dbFile.normalizedRelativePath),
    sql<boolean>`${dbFile.normalizedNameSource} IS DISTINCT FROM ${dbFile.name}`,
    sql<boolean>`${dbFile.normalizedRelativePathSource} IS DISTINCT FROM ${dbFile.relativePath}`,
  );

const capturedAtMissingWhere = () =>
  and(
    isNull(dbFile.capturedAt),
    isNotNull(dbFile.metadata),
    sql<boolean>`${dbFile.metadata} ~ ${CAPTURE_DATE_JSON_PATTERN}`,
  );

const fileDerivedFieldsMissingWhere = (afterId?: number) =>
  and(
    eq(dbFile.exists, true),
    ...(afterId === undefined ? [] : [gt(dbFile.id, afterId)]),
    or(searchFieldsMissingWhere(), capturedAtMissingWhere()),
  );

const backfillFiles = async (
  totals: FileDerivedFieldsBackfillTotals,
  incrementProgress?: () => void,
): Promise<void> => {
  let lastSeenId: number | undefined;
  let files = await fileDerivedFieldsBackfillBatch(lastSeenId);
  while (files.length > 0) {
    lastSeenId = files.at(-1)?.id;
    const prepared = files.map(prepareFileDerivedFieldsUpdate);
    totals.malformedCaptureDates += prepared.filter(
      ({ malformedCaptureDate }) => malformedCaptureDate,
    ).length;

    const pending = prepared.filter(
      ({ capturedAt, searchFields }) => capturedAt || searchFields,
    );
    if (pending.length > 0) {
      const updatedIds = await updateFileDerivedFieldsBatch(pending);
      const updated = new Set(updatedIds);
      for (const candidate of pending) {
        if (!updated.has(candidate.id)) continue;
        if (candidate.searchFields) totals.searchFieldsBackfilled++;
        if (candidate.capturedAt) totals.capturedAtBackfilled++;
      }
    }

    files.forEach(() => incrementProgress?.());
    files = await fileDerivedFieldsBackfillBatch(lastSeenId);
  }
};

export const prepareFileDerivedFieldsUpdate = (
  file: BackfillFile,
): PreparedFileDerivedFieldsUpdate => {
  const expectedSearchFields = fileSearchFields(file);
  const searchFieldsStale =
    file.normalizedName !== expectedSearchFields.normalizedName ||
    file.normalizedNameSource !== expectedSearchFields.normalizedNameSource ||
    file.normalizedRelativePath !==
      expectedSearchFields.normalizedRelativePath ||
    file.normalizedRelativePathSource !==
      expectedSearchFields.normalizedRelativePathSource;
  let capturedAt: Date | undefined;
  let malformedCaptureDate = false;

  if (file.capturedAt == null && file.metadata) {
    try {
      const metadata: unknown = JSON.parse(file.metadata);
      const dateTimeOriginal =
        typeof metadata === 'object' && metadata !== null
          ? (metadata as { DateTimeOriginal?: unknown }).DateTimeOriginal
          : undefined;
      if (typeof dateTimeOriginal === 'string' && dateTimeOriginal.trim()) {
        const derivedCapturedAt = capturedAtFromMetadata(metadata);
        if (derivedCapturedAt) capturedAt = derivedCapturedAt;
        else malformedCaptureDate = true;
      }
    } catch {
      if (CAPTURE_DATE_JSON_REGEX.test(file.metadata)) {
        malformedCaptureDate = true;
      }
    }
  }

  return {
    capturedAt,
    id: file.id,
    malformedCaptureDate,
    searchFields: searchFieldsStale ? expectedSearchFields : undefined,
    // Only the capture guard compares metadata, so search-only repairs (every
    // row on upgrade) avoid sending each row's full EXIF JSON back.
    sourceMetadata: capturedAt ? file.metadata : null,
    sourceName: file.name,
    sourceRelativePath: file.relativePath,
  };
};

const updateFileDerivedFieldsBatch = async (
  updates: PreparedFileDerivedFieldsUpdate[],
): Promise<number[]> => {
  const values = updates.map((update) => {
    const searchFields = update.searchFields;
    return sql`(
      ${update.id}::integer,
      ${update.sourceName}::text,
      ${update.sourceRelativePath}::text,
      ${update.sourceMetadata}::text,
      ${searchFields?.normalizedName ?? null}::text,
      ${searchFields?.normalizedNameSource ?? null}::text,
      ${searchFields?.normalizedRelativePath ?? null}::text,
      ${searchFields?.normalizedRelativePathSource ?? null}::text,
      ${update.capturedAt ?? null}::timestamptz,
      ${!!searchFields}::boolean,
      ${!!update.capturedAt}::boolean
    )`;
  });

  const result = await db.execute<{ id: number }>(sql`
    WITH derived_updates (
      id,
      source_name,
      source_relative_path,
      source_metadata,
      normalized_name,
      normalized_name_source,
      normalized_relative_path,
      normalized_relative_path_source,
      captured_at,
      update_search,
      update_capture
    ) AS (VALUES ${sql.join(values, sql`, `)})
    UPDATE ${dbFile}
    SET
      "normalizedName" = CASE WHEN derived_updates.update_search THEN derived_updates.normalized_name ELSE ${dbFile.normalizedName} END,
      "normalizedNameSource" = CASE WHEN derived_updates.update_search THEN derived_updates.normalized_name_source ELSE ${dbFile.normalizedNameSource} END,
      "normalizedRelativePath" = CASE WHEN derived_updates.update_search THEN derived_updates.normalized_relative_path ELSE ${dbFile.normalizedRelativePath} END,
      "normalizedRelativePathSource" = CASE WHEN derived_updates.update_search THEN derived_updates.normalized_relative_path_source ELSE ${dbFile.normalizedRelativePathSource} END,
      "capturedAt" = CASE WHEN derived_updates.update_capture THEN derived_updates.captured_at ELSE ${dbFile.capturedAt} END,
      "updatedAt" = NOW()
    FROM derived_updates
    WHERE ${dbFile.id} = derived_updates.id
      AND ${dbFile.exists} = true
      AND (
        NOT derived_updates.update_search
        OR (
          ${dbFile.name} = derived_updates.source_name
          AND ${dbFile.relativePath} = derived_updates.source_relative_path
        )
      )
      AND (
        NOT derived_updates.update_capture
        OR (
          ${dbFile.metadata} IS NOT DISTINCT FROM derived_updates.source_metadata
          AND ${dbFile.capturedAt} IS NULL
        )
      )
    RETURNING ${dbFile.id} AS id
  `);

  return result.rows.map(({ id }) => id);
};
