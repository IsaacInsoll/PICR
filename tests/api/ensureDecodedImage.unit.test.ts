import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { afterEach, expect, test, vi } from 'vitest';

const loadEnsureDecodedImage = async () => {
  vi.resetModules();

  const operations: string[] = [];
  const spawn = vi.fn((command: string, args: string[]) => {
    operations.push(args.includes('-TagsFromFile') ? 'copy' : 'extract');
    const child = Object.assign(new EventEmitter(), {
      kill: vi.fn(),
      stderr: new PassThrough(),
      stdout: new PassThrough(),
    });
    queueMicrotask(() => child.emit('close', 0, null));
    return child;
  });
  const rename = vi.fn(async () => {
    operations.push('rename');
  });
  const metadata = vi.fn(async () => {
    operations.push('validate');
    return { height: 4000, width: 6000 };
  });
  const decodedImagePath = vi.fn(
    () => '/cache/gallery/portrait.nef-decoded-raw-v2-hash-a.jpg',
  );

  vi.doMock('node:child_process', () => ({ spawn }));
  vi.doMock('node:fs', () => ({
    createWriteStream: vi.fn(() => new PassThrough()),
    existsSync: vi.fn(() => false),
  }));
  vi.doMock('node:fs/promises', () => ({
    mkdir: vi.fn(async () => undefined),
    rename,
    rm: vi.fn(async () => undefined),
    stat: vi.fn(async () => ({ size: 1024 })),
  }));
  vi.doMock('node:stream/promises', () => ({
    pipeline: vi.fn(async () => undefined),
  }));
  vi.doMock('../../backend/config/picrConfig.js', () => ({
    picrConfig: { exiftoolPath: '/usr/bin/exiftool' },
  }));
  vi.doMock('../../backend/filesystem/fileManager.js', () => ({
    fullPathForFile: vi.fn(() => '/media/gallery/portrait.nef'),
  }));
  vi.doMock('../../backend/logger.js', () => ({ log: vi.fn() }));
  vi.doMock('../../backend/media/decodedImagePath.js', () => ({
    decodedImagePath,
  }));
  vi.doMock('../../backend/media/decoderFor.js', () => ({
    decoderFor: vi.fn(() => 'exiftool'),
  }));
  vi.doMock('../../backend/media/openSharp.js', () => ({
    openSharp: vi.fn(() => ({ metadata })),
  }));

  const module = await import('../../backend/media/ensureDecodedImage.js');
  return { decodedImagePath, module, operations, rename, spawn };
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

test('copies RAW orientation before validating and promoting its embedded preview', async () => {
  const { decodedImagePath, module, operations, rename, spawn } =
    await loadEnsureDecodedImage();
  const file = {
    fileHash: 'hash-a',
    id: 7,
    name: 'portrait.nef',
    relativePath: 'gallery',
  };

  await expect(module.ensureDecodedImage(file)).resolves.toBe(
    '/cache/gallery/portrait.nef-decoded-raw-v2-hash-a.jpg',
  );

  expect(decodedImagePath).toHaveBeenCalledWith(file, 'exiftool');
  expect(spawn).toHaveBeenCalledTimes(2);
  expect(spawn).toHaveBeenNthCalledWith(
    1,
    '/usr/bin/exiftool',
    ['-b', '-JpgFromRaw', '/media/gallery/portrait.nef'],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );

  const candidate = spawn.mock.calls[1]?.[1]?.at(-1);
  expect(candidate).toMatch(
    /^\/cache\/gallery\/portrait\.nef-decoded-raw-v2-hash-a\.jpg\.\d+\.\d+\.0\.tmp\.jpg$/,
  );
  expect(spawn).toHaveBeenNthCalledWith(
    2,
    '/usr/bin/exiftool',
    [
      '-m',
      '-overwrite_original',
      '-TagsFromFile',
      '/media/gallery/portrait.nef',
      '-Orientation',
      candidate,
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  );
  expect(rename).toHaveBeenCalledWith(
    candidate,
    '/cache/gallery/portrait.nef-decoded-raw-v2-hash-a.jpg',
  );
  expect(operations).toEqual(['extract', 'copy', 'validate', 'rename']);
});
