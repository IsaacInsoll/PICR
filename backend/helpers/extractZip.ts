import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { openPromise, type Entry } from 'yauzl';

interface ExtractZipOptions {
  stripComponents?: number;
}

const unixFileTypeMask = 0o170000;
const unixRegularFileType = 0o100000;
const unixDirectoryType = 0o040000;
const unixSymlinkType = 0o120000;

export const extractZip = async (
  zipPath: string,
  outputPath: string,
  options: ExtractZipOptions = {},
) => {
  const outputRoot = path.resolve(outputPath);
  await mkdir(outputRoot, { recursive: true });

  const zipFile = await openPromise(zipPath, {
    lazyEntries: true,
    strictFileNames: true,
    validateEntrySizes: true,
  });

  try {
    for await (const entry of zipFile.eachEntry()) {
      const targetPath = targetPathForEntry(
        outputRoot,
        entry,
        options.stripComponents ?? 0,
      );
      if (!targetPath) continue;

      if (isUnsupportedUnixEntry(entry)) {
        throw new Error(
          `Refusing to extract unsupported ZIP entry: ${entry.fileName}`,
        );
      }

      if (isDirectory(entry)) {
        await mkdir(targetPath, { recursive: true });
        continue;
      }

      await mkdir(path.dirname(targetPath), { recursive: true });
      const readStream = await zipFile.openReadStreamPromise(entry);
      await pipeline(
        readStream,
        createWriteStream(targetPath, { flags: 'wx' }),
      );
    }
  } finally {
    zipFile.close();
  }
};

const targetPathForEntry = (
  outputRoot: string,
  entry: Entry,
  stripComponents: number,
) => {
  const parts = entry.fileName.split('/').filter(Boolean);
  const strippedParts = parts.slice(stripComponents);
  if (strippedParts.length === 0) return null;

  const relativeEntryPath = path.join(...strippedParts);
  const targetPath = path.resolve(outputRoot, relativeEntryPath);
  const relativeToOutput = path.relative(outputRoot, targetPath);

  if (relativeToOutput.startsWith('..') || path.isAbsolute(relativeToOutput)) {
    throw new Error(
      `Refusing to extract ZIP entry outside target: ${entry.fileName}`,
    );
  }

  return targetPath;
};

const isDirectory = (entry: Entry) => entry.fileName.endsWith('/');

const isUnsupportedUnixEntry = (entry: Entry) => {
  const unixMode = entry.externalFileAttributes >>> 16;
  const entryType = unixMode & unixFileTypeMask;
  if (entryType === 0) return false;
  if (entryType === unixSymlinkType) return true;
  if (entryType === unixDirectoryType) return !isDirectory(entry);
  return entryType !== unixRegularFileType;
};
