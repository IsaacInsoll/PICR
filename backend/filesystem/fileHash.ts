import crypto from 'crypto';
import fs from 'fs';
import { sep } from 'path';
import type { FileFields } from '../db/picrDb.js';

export const fileHash = (filePath: string): string => {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
};

export const fileHash2 = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', (err) => reject(err));
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
};

// hashing file contents takes too long, especially on larger files, and isn't really needed so lets do a fast alternative
export const fastHash = (file: FileFields, stats: fs.Stats): string => {
  const hashSum = crypto.createHash('sha256');
  hashSum.update(
    file.relativePath +
      sep +
      file.name +
      stats.mtime.toString() +
      stats.ctime.toString(),
  );
  return hashSum.digest('hex');
};

// Content-stable file identity: a fast signature (size + mtime) that is
// independent of path/name, so moves/renames don't change it while genuine edits
// do. Prefer the wrappers below — the runtime and the migration MUST derive mtime
// identically. Both use `Date#getTime()` (integer epoch ms); do NOT reach for
// `stats.mtimeMs`, which is fractional and would not match the DB `Date`.
const contentHash = (size: number, mtimeEpochMs: number): string => {
  const hashSum = crypto.createHash('sha256');
  hashSum.update(`${size}:${mtimeEpochMs}`);
  return hashSum.digest('hex');
};

// Runtime: derive the content hash from a filesystem stat.
export const contentHashForStats = (stats: fs.Stats): string =>
  contentHash(stats.size, stats.mtime.getTime());

// Migration: derive the content hash from stored DB fields, byte-identically to
// contentHashForStats (fileLastModified is the persisted stats.mtime).
export const contentHashForDb = (
  fileSize: number,
  fileLastModified: Date,
): string => contentHash(fileSize, fileLastModified.getTime());
