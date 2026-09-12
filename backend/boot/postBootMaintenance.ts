import { log } from '../logger.js';
import { backfillImageDimensions } from './backfillImageDimensions.js';
import { backfillFileDerivedFields } from './backfillFileDerivedFields.js';

export interface PostBootMaintenanceContext {
  currentVersion: string;
  previousBootedVersion: string | null | undefined;
}

export const postBootMaintenance = async (
  context: PostBootMaintenanceContext,
): Promise<void> => {
  const startedAt = Date.now();
  const derivedFieldsBackfill = await runMaintenanceTask(
    'file derived-fields backfill',
    backfillFileDerivedFields,
  );
  const dimensionBackfill = await runMaintenanceTask(
    'image dimension backfill',
    backfillImageDimensions,
  );
  const tasksRan =
    (dimensionBackfill?.backfilled ?? 0) > 0 ||
    (dimensionBackfill?.failed ?? 0) > 0 ||
    (dimensionBackfill?.skippedMissing ?? 0) > 0 ||
    (derivedFieldsBackfill?.capturedAtBackfilled ?? 0) > 0 ||
    (derivedFieldsBackfill?.searchFieldsBackfilled ?? 0) > 0;
  if (tasksRan) {
    log(
      'info',
      `PICR Post-boot maintenance complete for ${context.currentVersion} in ${elapsedSeconds(startedAt)} seconds; previous booted version was ${context.previousBootedVersion ?? 'unset'}`,
      true,
    );
  }
};

const runMaintenanceTask = async <T>(
  name: string,
  task: () => Promise<T>,
): Promise<T | null> => {
  const startedAt = Date.now();
  try {
    return await task();
  } catch (error) {
    log(
      'error',
      `PICR Post-boot maintenance task ${name} failed after ${elapsedSeconds(startedAt)} seconds; continuing startup with stale derived data: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
      true,
    );
    return null;
  }
};

const elapsedSeconds = (startedAt: number): string =>
  ((Date.now() - startedAt) / 1000).toFixed(2);
