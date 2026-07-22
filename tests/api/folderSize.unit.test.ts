import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  folderSize,
  folderSizeFromFilesystem,
} from '../../backend/helpers/folderSize';

let tempRoot: string | null = null;

const makeTempRoot = async () => {
  tempRoot = await mkdtemp(path.join(os.tmpdir(), 'picr-folder-size-'));
  return tempRoot;
};

afterEach(async () => {
  if (!tempRoot) return;
  await rm(tempRoot, { recursive: true, force: true });
  tempRoot = null;
});

describe('folderSizeFromFilesystem', () => {
  it('sums nested file sizes without following symlink targets', async () => {
    const root = await makeTempRoot();
    const nested = path.join(root, 'nested');
    await mkdir(nested);
    await writeFile(path.join(root, 'a.txt'), '1234');
    await writeFile(path.join(nested, 'b.txt'), '123456');
    await symlink(path.join(root, 'a.txt'), path.join(root, 'link-to-a'));

    const symlinkSize = Buffer.byteLength(path.join(root, 'a.txt'));

    await expect(folderSizeFromFilesystem(root)).resolves.toBe(
      4 + 6 + symlinkSize,
    );
  });
});

describe('folderSize', () => {
  it('returns a positive size for a real folder', async () => {
    const root = await makeTempRoot();
    await writeFile(path.join(root, 'file.txt'), 'content');

    await expect(folderSize(root)).resolves.toBeGreaterThan(0);
  });
});
