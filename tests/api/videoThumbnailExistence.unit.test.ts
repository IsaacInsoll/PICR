import { expect, test } from 'vitest';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import type { FileFields } from '../../backend/db/picrDb';
import { picrConfig } from '../../backend/config/picrConfig';
import { videoThumbnailArtifactsExist } from '../../backend/media/videoThumbnailExistence';
import {
  videoPosterPath,
  videoScrubPath,
} from '../../backend/media/videoThumbnailPaths';

test('videoThumbnailArtifactsExist requires AVIF posters only when AVIF is enabled', async () => {
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
    await Promise.all(
      (['sm', 'md', 'lg'] as const).map((size) =>
        touch(videoPosterPath(file, size)),
      ),
    );

    expect(videoThumbnailArtifactsExist(file, false)).toBe(true);
    expect(videoThumbnailArtifactsExist(file, true)).toBe(false);

    await Promise.all(
      (['sm', 'md', 'lg'] as const).map((size) =>
        touch(videoPosterPath(file, size, '.avif')),
      ),
    );

    expect(videoThumbnailArtifactsExist(file, true)).toBe(true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

const mkdtempRoot = () => mkdtemp(join(tmpdir(), 'picr-video-existence-'));

const touch = async (path: string) => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, 'x');
};
