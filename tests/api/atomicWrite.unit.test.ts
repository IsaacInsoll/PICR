import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { atomicWrite } from '../../backend/media/atomicWrite.js';
import { openSharp } from '../../backend/media/openSharp.js';

const tempRoots: string[] = [];

const makeTempRoot = async (): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), 'picr-atomic-write-'));
  tempRoots.push(root);
  return root;
};

afterEach(async () => {
  await Promise.all(
    tempRoots
      .splice(0)
      .map((root) => rm(root, { force: true, recursive: true })),
  );
});

test('atomic write removes temporary output and rethrows writer failures', async () => {
  const root = await makeTempRoot();
  const targetPath = join(root, 'failed.jpg');
  const writerError = new Error('encoder failed');

  await expect(
    atomicWrite(targetPath, async (tempPath) => {
      await writeFile(tempPath, 'partial image');
      throw writerError;
    }),
  ).rejects.toBe(writerError);

  await expect(readdir(root)).resolves.toEqual([]);
});

test('concurrent image encodes promote a complete decodable thumbnail', async () => {
  const root = await makeTempRoot();
  const targetPath = join(root, 'thumbnail.jpg');
  const input = await openSharp(Buffer.alloc(64 * 48 * 3, 120), {
    raw: { width: 64, height: 48, channels: 3 },
  })
    .jpeg()
    .toBuffer();
  const outputPath = () => targetPath;

  await Promise.all([
    atomicWrite(outputPath(), (tempPath) =>
      openSharp(input)
        .resize(250, 250, { fit: 'inside', withoutEnlargement: true })
        .jpeg()
        .toFile(tempPath),
    ),
    atomicWrite(outputPath(), (tempPath) =>
      openSharp(input)
        .resize(250, 250, { fit: 'inside', withoutEnlargement: true })
        .jpeg()
        .toFile(tempPath),
    ),
  ]);

  const metadata = await openSharp(targetPath).metadata();
  expect(metadata.format).toBe('jpeg');
  expect(metadata.width).toBe(64);
  expect(metadata.height).toBe(48);
  expect(await readdir(root)).toEqual(['thumbnail.jpg']);
});
