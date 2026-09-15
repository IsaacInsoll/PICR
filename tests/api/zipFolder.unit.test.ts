import { existsSync, readFileSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { picrConfig } from '../../backend/config/picrConfig.js';
import type { FolderFields } from '../../backend/db/picrDb.js';
import {
  hashZipFiles,
  zipFolder,
  zipPath,
  type ZipSourceFile,
} from '../../backend/helpers/zip.js';

const folder = { id: 42, name: 'Album' } as FolderFields;
const files: ZipSourceFile[] = [
  {
    id: 1,
    fileHash: 'hash-one',
    relativePath: 'Album',
    name: 'first.jpg',
    archivePath: 'first.jpg',
  },
  {
    id: 2,
    fileHash: 'hash-two',
    relativePath: 'Album/Sub',
    name: 'second.jpg',
    archivePath: 'Sub/second.jpg',
  },
];

const originalPaths = {
  mediaPath: picrConfig.mediaPath,
  cachePath: picrConfig.cachePath,
};
let tempRoot: string;

beforeEach(async () => {
  tempRoot = await mkdtemp(path.join(os.tmpdir(), 'picr-zip-folder-'));
  picrConfig.mediaPath = path.join(tempRoot, 'media');
  picrConfig.cachePath = path.join(tempRoot, 'cache');
  await mkdir(path.join(picrConfig.mediaPath, 'Album', 'Sub'), {
    recursive: true,
  });
  await writeFile(
    path.join(picrConfig.mediaPath, 'Album', 'first.jpg'),
    'first',
  );
  await writeFile(
    path.join(picrConfig.mediaPath, 'Album', 'Sub', 'second.jpg'),
    'second',
  );
});

afterEach(async () => {
  picrConfig.mediaPath = originalPaths.mediaPath;
  picrConfig.cachePath = originalPaths.cachePath;
  await rm(tempRoot, { recursive: true, force: true });
});

test('publishes a ZIP at its final path only after it completes', async () => {
  const folderHash = hashZipFiles(folder, files, 'complete-selection');
  const finalPath = zipPath(folderHash);

  await zipFolder(folderHash);

  expect(existsSync(finalPath)).toBe(true);
  expect(existsSync(`${finalPath}.partial`)).toBe(false);
  // ZIP entry names are stored uncompressed in the local and central headers.
  const archive = readFileSync(finalPath);
  expect(archive.includes('first.jpg')).toBe(true);
  expect(archive.includes('Sub/second.jpg')).toBe(true);
});

test('a failed ZIP never appears at the final path', async () => {
  const folderHash = hashZipFiles(folder, files, 'failed-selection');
  const finalPath = zipPath(folderHash);
  // A directory where the partial file belongs makes the write stream fail
  // with EISDIR, even for root (API tests run as root under `act`).
  await mkdir(`${finalPath}.partial`);

  await expect(zipFolder(folderHash)).rejects.toMatchObject({
    code: 'EISDIR',
  });

  expect(existsSync(finalPath)).toBe(false);
});

test('a missing selected file fails instead of producing an incomplete ZIP', async () => {
  const folderHash = hashZipFiles(
    folder,
    [
      ...files,
      {
        id: 3,
        fileHash: 'missing-hash',
        relativePath: 'Album',
        name: 'missing.jpg',
        archivePath: 'missing.jpg',
      },
    ],
    'missing-file-selection',
  );
  const finalPath = zipPath(folderHash);

  await expect(zipFolder(folderHash)).rejects.toMatchObject({ code: 'ENOENT' });

  expect(existsSync(finalPath)).toBe(false);
  expect(existsSync(`${finalPath}.partial`)).toBe(false);
});
