import { log } from '../logger.js';
import { backfillImageDimensions } from './backfillImageDimensions.js';

export interface PostBootMaintenanceContext {
  currentVersion: string;
  previousBootedVersion: string | null | undefined;
}

export const postBootMaintenance = async (
  context: PostBootMaintenanceContext,
): Promise<void> => {
  const startedAt = Date.now();
  try {
    const dimensionBackfill = await backfillImageDimensions();
    const tasksRan =
      dimensionBackfill.backfilled > 0 ||
      dimensionBackfill.failed > 0 ||
      dimensionBackfill.skippedMissing > 0;
    if (tasksRan) {
      log(
        'info',
        `PICR Post-boot maintenance complete for ${context.currentVersion} in ${elapsedSeconds(startedAt)} seconds; previous booted version was ${context.previousBootedVersion ?? 'unset'}`,
        true,
      );
    }
  } catch (error) {
    log(
      'error',
      `Post-boot maintenance failed after ${elapsedSeconds(startedAt)} seconds; continuing startup with stale derived data: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
      true,
    );
  }
};

const elapsedSeconds = (startedAt: number): string =>
  ((Date.now() - startedAt) / 1000).toFixed(2);
