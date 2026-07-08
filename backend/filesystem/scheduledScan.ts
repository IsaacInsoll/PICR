import { and, asc, eq, gte } from 'drizzle-orm';
import type { IPicrConfiguration } from '../config/IPicrConfiguration.js';
import { db } from '../db/picrDb.js';
import { dbFile } from '../db/models/index.js';
import { log } from '../logger.js';
import { addToQueue } from './fileQueue.js';
import { scanFolderTree, type ScanFolderTreeResult } from './scanFolder.js';

export const SCHEDULED_SCAN_THUMB_LIMIT = 5000; // can be promoted to env var in future

type ScheduledTimer = ReturnType<typeof setInterval>;
type SetIntervalFn = (handler: () => void, timeout: number) => ScheduledTimer;
type ClearIntervalFn = (timer: ScheduledTimer) => void;

let scheduledScanRunning = false;

export const startScheduledScan = (
  config: Pick<IPicrConfiguration, 'scheduledScanHours'>,
  rootFolderId = 1,
  setIntervalFn: SetIntervalFn = setInterval,
  clearIntervalFn: ClearIntervalFn = clearInterval,
): (() => void) | undefined => {
  if (config.scheduledScanHours <= 0) return undefined;

  const intervalMs = config.scheduledScanHours * 60 * 60 * 1000;
  log(
    'info',
    `🕒 Scheduled scan enabled every ${config.scheduledScanHours} hour(s)`,
    true,
  );

  const timer = setIntervalFn(() => {
    void runScheduledScan(rootFolderId);
  }, intervalMs);

  return () => clearIntervalFn(timer);
};

export const runScheduledScan = async (rootFolderId = 1): Promise<void> => {
  if (scheduledScanRunning) {
    log(
      'warn',
      'Scheduled scan skipped because a previous scan is still running',
    );
    return;
  }

  scheduledScanRunning = true;
  const startedAt = new Date();
  const startedMs = Date.now();

  try {
    log('info', '🕒 Scheduled scan started', true);
    const result = await scanFolderTree(rootFolderId, {
      generateThumbs: false,
    });
    await queueScheduledThumbnails(startedAt, result);
    log(
      result.completed ? 'info' : 'warn',
      `🕒 Scheduled scan ${result.completed ? 'complete' : 'finished with unsettled files'} after ${result.scanPasses} pass(es) in ${((Date.now() - startedMs) / 1000).toFixed(2)} seconds`,
      true,
    );
  } catch (error) {
    log(
      'error',
      `Scheduled scan failed; serving existing data: ${errorMessage(error)}`,
      true,
    );
  } finally {
    scheduledScanRunning = false;
  }
};

export const resetScheduledScanStateForTests = (): void => {
  scheduledScanRunning = false;
};

const queueScheduledThumbnails = async (
  scanStartedAt: Date,
  result: Pick<ScanFolderTreeResult, 'addedFiles'>,
): Promise<void> => {
  if (result.addedFiles === 0) return;

  if (result.addedFiles > SCHEDULED_SCAN_THUMB_LIMIT) {
    log(
      'warn',
      `Scheduled scan deferred ${result.addedFiles} thumbnails because it exceeds the ${SCHEDULED_SCAN_THUMB_LIMIT} file limit`,
    );
    return;
  }

  const files = await db
    .select({ id: dbFile.id })
    .from(dbFile)
    .where(and(gte(dbFile.createdAt, scanStartedAt), eq(dbFile.exists, true)))
    .orderBy(asc(dbFile.name));

  for (const file of files) {
    addToQueue('generateThumbnails', { id: file.id });
  }
};

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
