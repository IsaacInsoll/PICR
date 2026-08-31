import { promises as fs } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import { picrConfig } from '../../backend/config/picrConfig.js';
import {
  createThumbnailVariantIndex,
  thumbnailVariantDestinationPath,
  thumbnailVariantPaths,
} from '../../backend/media/thumbnailVariants.js';
import {
  thumbnailVariantFormatForLetter,
  thumbnailVariantFormats,
  thumbnailVariantLadderForSettings,
  parseThumbnailVariantToken,
  thumbnailVariantForToken,
  thumbnailVariantQualityForSettings,
  thumbnailVariantToken,
  thumbnailVariantWidths,
} from '../../shared/thumbnailVariants.js';

const tempRoots: string[] = [];

const makeTempRoot = async (): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), 'picr-thumbnail-variants-'));
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

test('builds stable JPEG variant tokens from ladder width and quality', () => {
  expect(thumbnailVariantToken(1000, 80)).toBe('v1-1000j80');
  expect(thumbnailVariantToken(1000, 80, 'jpeg')).toBe('v1-1000j80');
});

test('resolves variant format metadata by token letter', () => {
  expect(thumbnailVariantFormatForLetter('j')).toMatchObject({
    format: 'jpeg',
    letter: 'j',
    extension: '.jpg',
    mimeType: 'image/jpeg',
    generationPolicy: 'eager',
    enabled: true,
    qualitySetting: 'thumbnailJpegQuality',
  });
  expect(thumbnailVariantFormatForLetter('w')).toBeNull();
});

test('publishes the fixed thumbnail ladder at the requested quality', () => {
  const ladder = thumbnailVariantLadderForSettings({
    thumbnailJpegQuality: 80,
  });

  expect(ladder.map((variant) => variant.width)).toEqual([
    250, 500, 750, 1000, 1500, 2048, 2560, 4000,
  ]);
  expect(ladder).toHaveLength(thumbnailVariantWidths.length);
  expect(ladder[0]).toMatchObject({
    token: 'v1-250j80',
    format: 'jpeg',
    letter: 'j',
    extension: '.jpg',
    mimeType: 'image/jpeg',
    quality: 80,
    generationPolicy: thumbnailVariantFormats.jpeg.generationPolicy,
  });
});

test('builds the thumbnail ladder from registry-owned quality settings', () => {
  const ladder = thumbnailVariantLadderForSettings({
    thumbnailJpegQuality: 75,
  });

  expect(ladder).toHaveLength(thumbnailVariantWidths.length);
  expect(new Set(ladder.map((variant) => variant.token)).size).toBe(
    ladder.length,
  );
  expect(ladder[3]).toMatchObject({
    token: 'v1-1000j75',
    format: 'jpeg',
    quality: 75,
  });
  expect(
    thumbnailVariantQualityForSettings(thumbnailVariantFormats.jpeg, {
      thumbnailJpegQuality: 75,
    }),
  ).toBe(75);
});

test('parses variant token parts without applying the generation allowlist', () => {
  expect(parseThumbnailVariantToken('v1-1024j75')).toEqual({
    cacheVersion: 'v1',
    width: 1024,
    letter: 'j',
    quality: 75,
  });
});

test('resolves allowed current-version JPEG ladder tokens', () => {
  expect(thumbnailVariantForToken('v1-2048j80')).toEqual({
    token: 'v1-2048j80',
    cacheVersion: 'v1',
    width: 2048,
    format: 'jpeg',
    letter: 'j',
    extension: '.jpg',
    mimeType: 'image/jpeg',
    quality: 80,
    generationPolicy: 'eager',
  });
});

test('rejects unsupported variant tokens', () => {
  expect(thumbnailVariantForToken('sm')).toBeNull();
  expect(thumbnailVariantForToken('v2-1000j80')).toBeNull();
  expect(thumbnailVariantForToken('v1-1024j80')).toBeNull();
  expect(thumbnailVariantForToken('v1-1000w80')).toBeNull();
  expect(thumbnailVariantForToken('v1-1000j0')).toBeNull();
  expect(thumbnailVariantForToken('v1-1000j101')).toBeNull();
  expect(thumbnailVariantForToken('v1-01000j80')).toBeNull();
});

test('discovers image cache variants from existing directory entries', async () => {
  const root = await makeTempRoot();
  picrConfig.cachePath = join(root, 'cache');

  await touch('/cache/thumbs/gallery/IMG_0001.jpg-md-oldhash.jpg');
  await touch('/cache/thumbs/gallery/IMG_0001.jpg-lg-oldhash.avif');
  await touch('/cache/thumbs/gallery/IMG_0001.jpg-v1-1000j80-oldhash.jpg');
  await touch('/cache/thumbs/gallery/IMG_0001.jpg-decoded-oldhash.jpg');
  await touch('/cache/thumbs/gallery/IMG_0001.jpg-md-newhash.jpg');
  await touch('/cache/thumbs/gallery/other.jpg-md-oldhash.jpg');

  const variants = await thumbnailVariantPaths(
    'gallery',
    'IMG_0001.jpg',
    'oldhash',
    'Image',
  );

  expect(variants.map(({ variantKey, extension }) => [variantKey, extension]))
    .toMatchInlineSnapshot(`
      [
        [
          "decoded",
          ".jpg",
        ],
        [
          "lg",
          ".avif",
        ],
        [
          "md",
          ".jpg",
        ],
        [
          "v1-1000j80",
          ".jpg",
        ],
      ]
    `);
  expect(
    thumbnailVariantDestinationPath('new-gallery', 'renamed.jpg', 'newhash', {
      variantKey: variants[3].variantKey,
      extension: variants[3].extension,
    }),
  ).toBe(
    join(
      picrConfig.cachePath,
      'thumbs',
      'new-gallery',
      'renamed.jpg-v1-1000j80-newhash.jpg',
    ),
  );
});

test('discovers versioned video files and legacy montage directories', async () => {
  const root = await makeTempRoot();
  picrConfig.cachePath = join(root, 'cache');

  await touch('/cache/thumbs/videos/clip.mp4-v2-sm-oldhash.jpg');
  await touch('/cache/thumbs/videos/clip.mp4-v2-scrub-oldhash.jpg');
  await touch('/cache/thumbs/videos/clip.mp4-v2-posterframe-oldhash.jpg');
  await mkdir(
    join(picrConfig.cachePath, 'thumbs', 'videos', 'clip.mp4-md-oldhash.mp4'),
    { recursive: true },
  );

  const variants = await thumbnailVariantPaths(
    'videos',
    'clip.mp4',
    'oldhash',
    'Video',
  );

  expect(
    variants.map(({ variantKey, extension, isDirectory }) => ({
      variantKey,
      extension,
      isDirectory,
    })),
  ).toMatchInlineSnapshot(`
    [
      {
        "extension": ".mp4",
        "isDirectory": true,
        "variantKey": "md",
      },
      {
        "extension": ".jpg",
        "isDirectory": false,
        "variantKey": "v2-posterframe",
      },
      {
        "extension": ".jpg",
        "isDirectory": false,
        "variantKey": "v2-scrub",
      },
      {
        "extension": ".jpg",
        "isDirectory": false,
        "variantKey": "v2-sm",
      },
    ]
  `);
});

test('reuses indexed directory reads across files in the same cache folder', async () => {
  const root = await makeTempRoot();
  picrConfig.cachePath = join(root, 'cache');
  await touch('/cache/thumbs/gallery/a.jpg-sm-hash-a.jpg');
  await touch('/cache/thumbs/gallery/b.jpg-sm-hash-b.jpg');
  const index = createThumbnailVariantIndex();
  const readdir = vi.spyOn(fs, 'readdir');

  await thumbnailVariantPaths('gallery', 'a.jpg', 'hash-a', 'Image', index);
  await thumbnailVariantPaths('gallery', 'b.jpg', 'hash-b', 'Image', index);

  expect(readdir).toHaveBeenCalledOnce();
  readdir.mockRestore();
});

const touch = async (cachePath: string): Promise<void> => {
  const path = cachePath.replace('/cache', picrConfig.cachePath);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, 'x');
};
