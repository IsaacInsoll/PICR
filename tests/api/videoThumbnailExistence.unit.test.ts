import { expect, test } from 'vitest';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import type { FileFields } from '../../backend/db/picrDb';
import { picrConfig } from '../../backend/config/picrConfig';
import {
  missingVideoPosterVariants,
  videoThumbnailBaselineArtifactsExist,
} from '../../backend/media/videoThumbnailExistence';
import {
  videoPosterFramePath,
  videoPosterVariantPath,
  videoScrubPath,
} from '../../backend/media/videoThumbnailPaths';
import { thumbnailVariantForToken } from '../../shared/thumbnailVariants';

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

test('missingVideoPosterVariants reports poster derivatives independently of baseline artifacts', async () => {
  const root = await mkdtempRoot();
  picrConfig.cachePath = join(root, 'cache');
  picrConfig.mediaPath = join(root, 'media');
  const file = {
    relativePath: 'videos',
    name: 'clip.mp4',
    fileHash: 'content-hash',
  } as FileFields;
  const existing = thumbnailVariantForToken('v1-250j80')!;
  const missing = thumbnailVariantForToken('v1-500j80')!;

  try {
    await touch(videoPosterVariantPath(file, existing));

    expect(missingVideoPosterVariants(file, [existing, missing])).toEqual([
      missing,
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

const mkdtempRoot = () => mkdtemp(join(tmpdir(), 'picr-video-existence-'));

const touch = async (path: string) => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, 'x');
};
