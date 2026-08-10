import type { IncomingMessage } from 'node:http';
import { picrConfig } from '../config/picrConfig.js';
import type { OnViewScanMode } from '../config/IPicrConfiguration.js';
import { log } from '../logger.js';
import type { PicrRequestContext } from '../types/PicrRequestContext.js';
import { scanFolder, type ScanFolderOptions } from './scanFolder.js';

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
  const promise = scanFolder(folderId, options).then(() => undefined);
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
    return { generateThumbs: true, depth: 0, scanExistingFolders: false };
  }

  return {
    generateThumbs: true,
    depth: 1,
    scanExistingFolders: mode === 'one_level',
  };
};

export const resetOnViewScanStateForTests = (): void => {
  inFlightScans.clear();
  lastScanStartedAt.clear();
};

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
