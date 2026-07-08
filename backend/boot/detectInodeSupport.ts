import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { picrConfig } from '../config/picrConfig.js';
import { isIgnoredPath } from '../filesystem/ignoredPaths.js';
import { log } from '../logger.js';

export type InodeSupportStatus = 'enabled' | 'disabled' | 'unknown';

interface InodeSupportResult {
  status: InodeSupportStatus;
  reason: string;
}

export const detectInodeSupport = (): void => {
  const result = probeInodeSupport(picrConfig.mediaPath);
  picrConfig.inodeSupport = result.status;
  picrConfig.inodeSupportReason = result.reason;

  if (result.status === 'unknown') {
    log('info', `Inode support unknown: ${result.reason}`);
  } else if (result.status === 'disabled') {
    log('warn', `Inode support disabled: ${result.reason}`);
  }
};

export const probeInodeSupport = (mediaPath: string): InodeSupportResult => {
  let entries;
  try {
    entries = readdirSync(mediaPath, { withFileTypes: true });
  } catch (error) {
    return {
      status: 'unknown',
      reason: `Unable to read media path: ${errorMessage(error)}`,
    };
  }

  const sample = entries.find((entry) => {
    return !isIgnoredPath(join(mediaPath, entry.name));
  });

  if (!sample) {
    return {
      status: 'unknown',
      reason: 'No non-ignored media entries found to sample yet',
    };
  }

  const samplePath = join(mediaPath, sample.name);
  try {
    return inodeSupportForIno(statSync(samplePath, { bigint: true }).ino);
  } catch (error) {
    return {
      status: 'unknown',
      reason: `Unable to stat sampled media entry: ${errorMessage(error)}`,
    };
  }
};

export const inodeSupportForIno = (ino: bigint): InodeSupportResult => {
  if (ino > 0n) {
    return {
      status: 'enabled',
      reason: 'Inode identifiers present; used for move/rename tracking',
    };
  }

  return {
    status: 'disabled',
    reason:
      'Filesystem reports no inodes; move detection falls back to path and content hash',
  };
};

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
