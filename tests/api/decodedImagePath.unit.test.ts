import { afterEach, expect, test, vi } from 'vitest';

const loadDecodedImagePath = async () => {
  vi.resetModules();

  vi.doMock('../../backend/config/picrConfig.js', () => ({
    picrConfig: { cachePath: '/cache' },
  }));
  vi.doMock('../../backend/filesystem/fileManager.js', () => ({
    fullPathForFile: vi.fn(
      (file: { name: string; relativePath: string }) =>
        `/media/${file.relativePath}/${file.name}`,
    ),
    relativePath: vi.fn((path: string) => path.replace('/media/', '')),
  }));

  return import('../../backend/media/decodedImagePath.js');
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

const file = {
  fileHash: 'hash-a',
  name: 'portrait.nef',
  relativePath: 'gallery',
};

test('versions RAW decoded previews after orientation propagation changed', async () => {
  const { decodedImagePath } = await loadDecodedImagePath();

  expect(decodedImagePath(file, 'exiftool')).toBe(
    '/cache/thumbs/gallery/portrait.nef-decoded-raw-v2-hash-a.jpg',
  );
});

test('keeps the existing decoded cache path for ImageMagick formats', async () => {
  const { decodedImagePath } = await loadDecodedImagePath();

  expect(decodedImagePath(file, 'magick')).toBe(
    '/cache/thumbs/gallery/portrait.nef-decoded-hash-a.jpg',
  );
});
