import archiver from 'archiver';
import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, rename, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { log } from '../logger.js';

interface ZipSource {
  path: string;
  name: string;
}

// Publish only after the destination stream has closed successfully. A failed
// or interrupted write must never leave a file that looks like a cache hit.
export const writeZip = async (
  path: string,
  files: ZipSource[],
  onProgress: (filesDone: number) => void,
) => {
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.${randomUUID()}.partial`;
  const archive = archiver('zip', {
    // Gallery media is already compressed. STORE avoids spending CPU on a
    // second compression pass and preserves each original byte-for-byte.
    store: true,
    forceZip64: true,
  });
  const output = createWriteStream(temporaryPath, { flags: 'wx' });
  // Archiver normally skips missing files with a warning. Delivery archives
  // must contain every indexed source, so warnings fail the whole job.
  archive.on('warning', (error) => archive.destroy(error));
  archive.on('progress', ({ entries }) => onProgress(entries.processed));
  const written = pipeline(archive, output);

  try {
    for (const file of files) archive.file(file.path, { name: file.name });
    await Promise.all([archive.finalize(), written]);
    await rename(temporaryPath, path);
  } catch (error) {
    archive.abort();
    archive.destroy();
    output.destroy();
    await written.catch(() => {}); // Preserve the original failure below.
    try {
      await rm(temporaryPath, { force: true });
    } catch (cleanupError) {
      log(
        'error',
        `Unable to remove partial ZIP ${temporaryPath}: ${String(cleanupError)}`,
      );
    }
    throw error;
  }
};
