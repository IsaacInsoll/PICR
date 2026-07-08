import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, expect, test } from 'vitest';
import {
  inodeSupportForIno,
  probeInodeSupport,
} from '../../backend/boot/detectInodeSupport';

const mediaRoots: string[] = [];

const createMediaRoot = async () => {
  const mediaRoot = await mkdtemp(join(tmpdir(), 'picr-inode-probe-'));
  mediaRoots.push(mediaRoot);
  return mediaRoot;
};

afterEach(async () => {
  await Promise.all(
    mediaRoots
      .splice(0)
      .map((mediaRoot) => rm(mediaRoot, { recursive: true, force: true })),
  );
});

test('reports unknown when the media path has no sampleable child entries', async () => {
  const mediaRoot = await createMediaRoot();

  expect(probeInodeSupport(mediaRoot)).toMatchObject({
    status: 'unknown',
    reason: expect.stringContaining('No non-ignored media entries'),
  });
});

test('skips ignored entries when choosing an inode probe sample', async () => {
  const mediaRoot = await createMediaRoot();
  await writeFile(join(mediaRoot, '.hidden.jpg'), 'ignored');
  await mkdir(join(mediaRoot, '@eaDir'));

  expect(probeInodeSupport(mediaRoot)).toMatchObject({
    status: 'unknown',
    reason: expect.stringContaining('No non-ignored media entries'),
  });
});

test('reports enabled when a sampled child has an inode', async () => {
  const mediaRoot = await createMediaRoot();
  await writeFile(join(mediaRoot, 'sample.jpg'), 'sample');

  expect(probeInodeSupport(mediaRoot)).toMatchObject({
    status: 'enabled',
    reason: expect.stringContaining('Inode identifiers present'),
  });
});

test('classifies zero inode values as disabled', () => {
  expect(inodeSupportForIno(0n)).toMatchObject({
    status: 'disabled',
    reason: expect.stringContaining('reports no inodes'),
  });
});
