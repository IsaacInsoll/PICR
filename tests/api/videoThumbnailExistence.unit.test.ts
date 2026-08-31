import { expect, test } from 'vitest';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import type { FileFields } from '../../backend/db/picrDb';
import { picrConfig } from '../../backend/config/picrConfig';
import {
  missingVideoPosterSizes,
  videoThumbnailBaselineArtifactsExist,
} from '../../backend/media/videoThumbnailExistence';
import {
  videoPosterFramePath,
  videoPosterPath,
  videoScrubPath,
} from '../../backend/media/videoThumbnailPaths';

test('videoThumbnailBaselineArtifactsExist requires scrub sprite and poster frame', async () => {
  const root = await mkdtempRoot();
  picrConfig.cachePath = join(root, 'cache');
  picrConfig.mediaPath = join(root, 'media');
  const file = {
    relativePath: 'videos',
    name: 'clip.mp4',
    fileHash: 'content-hash',
  } as FileFields;

  try {
    await touch(videoScrubPath(file));
    await touch(videoPosterFramePath(file));

    expect(videoThumbnailBaselineArtifactsExist(file)).toBe(true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('missingVideoPosterSizes reports poster derivatives independently of baseline artifacts', async () => {
  const root = await mkdtempRoot();
  picrConfig.cachePath = join(root, 'cache');
  picrConfig.mediaPath = join(root, 'media');
  const file = {
    relativePath: 'videos',
    name: 'clip.mp4',
    fileHash: 'content-hash',
  } as FileFields;

  try {
    await touch(videoPosterPath(file, 'sm'));

    expect(missingVideoPosterSizes(file)).toEqual(['md', 'lg']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

const mkdtempRoot = () => mkdtemp(join(tmpdir(), 'picr-video-existence-'));

const touch = async (path: string) => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, 'x');
};
