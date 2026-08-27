import type { IncomingMessage } from 'node:http';
import { picrConfig } from '../config/picrConfig.js';
import type { OnViewScanMode } from '../config/IPicrConfiguration.js';
import { dbFolderForId } from '../db/picrDb.js';
import { delay } from '../helpers/delay.js';
import { log } from '../logger.js';
import type { PicrRequestContext } from '../types/PicrRequestContext.js';
import {
  SCAN_SETTLE_SECONDS,
  scanFolder,
  type ScanFolderOptions,
  type ScanFolderResult,
} from './scanFolder.js';
import { enqueueScanThumbnails } from './scanThumbnails.js';
import { withMediaScanActivity } from './mediaScanActivity.js';

export const ON_VIEW_SCAN_COOLDOWN_MS = 60_000; // can be promoted to env var in future

type OnViewScanStartResult =
  | { status: 'disabled' | 'cooldown' | 'in_flight' }
  | { status: 'started'; promise: Promise<void> };

const requestScanFolders = new WeakMap<IncomingMessage, Set<number>>();
const inFlightScans = new Map<number, Promise<void>>();
const lastScanStartedAt = new Map<number, number>();

export const createOnViewScanSet = (request: IncomingMessage): Set<number> => {
  const folderIds = new Set<number>();
  requestScanFolders.set(request, folderIds);
  return folderIds;
};

export const markFolderViewedForScan = (
  context: Pick<PicrRequestContext, 'scanFolderIds'>,
  folderId: number,
): void => {
  context.scanFolderIds?.add(folderId);
};

export const drainOnViewScanRequests = (request: IncomingMessage): void => {
  const folderIds = requestScanFolders.get(request);
  requestScanFolders.delete(request);
  if (!folderIds?.size) return;

  for (const folderId of folderIds) {
    enqueueOnViewScan(folderId);
  }
};

export const enqueueOnViewScan = (folderId: number): void => {
  const result = startOnViewScan(folderId);
  if (result.status !== 'started') return;

  result.promise.catch((error: unknown) => {
    log(
      'error',
      `On-view scan failed for folder ${folderId}: ${errorMessage(error)}`,
    );
  });
};

export const startOnViewScan = (
  folderId: number,
  now = Date.now(),
): OnViewScanStartResult => {
  const options = onViewScanOptions(folderId, picrConfig.onViewScanMode);
  if (!options) return { status: 'disabled' };

  if (inFlightScans.has(folderId)) return { status: 'in_flight' };

  const lastStartedAt = lastScanStartedAt.get(folderId);
  if (
    lastStartedAt !== undefined &&
    now - lastStartedAt < ON_VIEW_SCAN_COOLDOWN_MS
  ) {
    return { status: 'cooldown' };
  }

  lastScanStartedAt.set(folderId, now);
  const promise = withMediaScanActivity(() => runOnViewScan(folderId, options));
  inFlightScans.set(folderId, promise);
  const cleanup = () => {
    if (inFlightScans.get(folderId) === promise) {
      inFlightScans.delete(folderId);
    }
  };
  promise.then(cleanup, cleanup);

  return { status: 'started', promise };
};

export const onViewScanOptions = (
  folderId: number,
  mode: OnViewScanMode,
): ScanFolderOptions | undefined => {
  if (mode === 'off') return undefined;

  const directOnly = folderId === 1 || mode === 'direct';
  if (directOnly) {
    return { generateThumbs: false, depth: 0, scanExistingFolders: false };
  }

  return {
    generateThumbs: false,
    depth: 1,
    scanExistingFolders: mode === 'one_level',
  };
};

const runOnViewScan = async (
  folderId: number,
  options: ScanFolderOptions,
): Promise<void> => {
  const folder = await dbFolderForId(folderId);
  if (!folder) throw new Error(`Folder ${folderId} is unavailable`);
  const scanRootPath = folder.relativePath ?? '';

  const firstResult = await runOnViewScanPass(folderId, scanRootPath, options);
  if (!hasUnsettledWork(firstResult)) return;

  await delay(SCAN_SETTLE_SECONDS * 1000);
  await runOnViewScanPass(folderId, scanRootPath, options);
};

const runOnViewScanPass = async (
  folderId: number,
  scanRootPath: string,
  options: ScanFolderOptions,
): Promise<ScanFolderResult> => {
  const passStartedAt = new Date();
  const result = await scanFolder(folderId, options);
  await enqueueScanThumbnails(scanRootPath, passStartedAt);
  return result;
};

const hasUnsettledWork = (result: ScanFolderResult): boolean =>
  result.unsettledFiles > 0 || result.unsettledFolders > 0;

export const resetOnViewScanStateForTests = (): void => {
  inFlightScans.clear();
  lastScanStartedAt.clear();
};

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
