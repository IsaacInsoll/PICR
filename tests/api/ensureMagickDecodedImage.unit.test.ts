import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { afterEach, expect, test, vi } from 'vitest';

const file = {
  id: 7,
  name: 'portrait.JXL',
  relativePath: 'gallery',
  fileHash: 'hash-a',
};
const target = '/cache/thumbs/gallery/portrait.JXL-decoded-jxl-v2-hash-a.png';

const loadDecoder = async ({
  mode = 'success',
  valid = true,
  transformFails = false,
}: {
  mode?: 'success' | 'exit' | 'timeout';
  valid?: boolean;
  transformFails?: boolean;
} = {}) => {
  vi.resetModules();
  let processExited = false;
  const close = (status: number | null, signal: string | null) => {
    processExited = true;
    child.emit('close', status, signal);
  };
  const kill = vi.fn(() => {
    queueMicrotask(() => close(null, 'SIGKILL'));
    return true;
  });
  const child = Object.assign(new EventEmitter(), {
    stderr: new PassThrough(),
    kill,
  });
  const spawn = vi.fn((_command: string, _args: string[]) => {
    if (mode !== 'timeout')
      queueMicrotask(() => {
        if (mode === 'exit') child.stderr.write('invalid JPEG XL');
        close(mode === 'exit' ? 1 : 0, null);
      });
    return child;
  });
  const rename = vi.fn(async () => undefined);
  const rm = vi.fn(async () => undefined);
  const log = vi.fn();
  const metadata = vi.fn(async () =>
    valid ? { width: 120, height: 160 } : {},
  );
  const image = {
    keepMetadata: vi.fn(),
    withIccProfile: vi.fn(),
    png: vi.fn(),
    metadata,
    toFile: vi.fn(async (_path: string) => {
      expect(processExited).toBe(true);
      if (transformFails) throw new Error('PNG conversion failed');
    }),
  };
  image.keepMetadata.mockReturnValue(image);
  image.withIccProfile.mockReturnValue(image);
  image.png.mockReturnValue(image);
  const openSharp = vi.fn((_input: string) => image);
  vi.doMock('node:child_process', () => ({ spawn }));
  vi.doMock('node:fs', () => ({
    existsSync: vi.fn(() => false),
    createWriteStream: vi.fn(),
  }));
  vi.doMock('node:fs/promises', () => ({
    mkdir: vi.fn(async () => undefined),
    rename,
    rm,
    stat: vi.fn(async () => ({ size: 1024 })),
  }));
  vi.doMock('../../backend/config/picrConfig.js', () => ({
    picrConfig: { magickPath: '/tools/magick' },
  }));
  vi.doMock('../../backend/filesystem/fileManager.js', () => ({
    fullPathForFile: () => '/media/gallery/portrait.JXL',
  }));
  vi.doMock('../../backend/logger.js', () => ({ log }));
  vi.doMock('../../backend/media/decodedImagePath.js', () => ({
    decodedImagePath: () => target,
  }));
  vi.doMock('../../backend/media/decoderFor.js', () => ({
    decoderFor: () => 'magick',
  }));
  vi.doMock('../../backend/media/openSharp.js', () => ({ openSharp }));
  const { ensureDecodedImage } =
    await import('../../backend/media/ensureDecodedImage');
  return {
    ensureDecodedImage,
    spawn,
    rename,
    rm,
    kill,
    log,
    metadata,
    image,
    openSharp,
  };
};

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.resetModules();
});

test('concurrent JXL decodes share a file-backed conversion and validate before publication', async () => {
  const { ensureDecodedImage, spawn, rename, metadata, image, openSharp, rm } =
    await loadDecoder();
  rename.mockImplementation(async () => {
    expect(metadata).toHaveBeenCalledOnce();
    expect(image.toFile).toHaveBeenCalledOnce();
  });
  await expect(
    Promise.all([ensureDecodedImage(file), ensureDecodedImage(file)]),
  ).resolves.toEqual([target, target]);
  expect(spawn).toHaveBeenCalledOnce();
  expect(spawn).toHaveBeenCalledWith(
    '/tools/magick',
    [
      '/media/gallery/portrait.JXL[0]',
      '-auto-orient',
      '-colorspace',
      'sRGB',
      '-define',
      'png:compression-level=0',
      expect.stringMatching(/\.1\.tmp\.png$/),
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  );
  const transport = spawn.mock.calls[0]?.[1].at(-1);
  expect(openSharp).toHaveBeenCalledWith(transport);
  expect(image.withIccProfile).toHaveBeenCalledWith('srgb');
  expect(image.png).toHaveBeenCalledWith({
    compressionLevel: 1,
    adaptiveFiltering: true,
  });
  expect(image.toFile).toHaveBeenCalledWith(
    expect.stringMatching(/\.0\.tmp\.png$/),
  );
  expect(rm).toHaveBeenCalledWith(transport, { force: true });
  expect(rename).toHaveBeenCalledWith(
    expect.stringMatching(/\.0\.tmp\.png$/),
    target,
  );
});

test('a failed PNG conversion removes both candidates after the decoder has exited', async () => {
  const { ensureDecodedImage, kill, rm, rename } = await loadDecoder({
    transformFails: true,
  });
  await expect(ensureDecodedImage(file)).rejects.toThrow(
    'PNG conversion failed',
  );
  expect(kill).not.toHaveBeenCalled();
  expect(rename).not.toHaveBeenCalled();
  expect(rm).toHaveBeenCalledWith(expect.stringMatching(/\.1\.tmp\.png$/), {
    force: true,
  });
  expect(rm).toHaveBeenCalledWith(expect.stringMatching(/\.0\.tmp\.png$/), {
    force: true,
  });
});

test('failed JXL decoding removes transport and candidate files and logs once per content hash', async () => {
  const { ensureDecodedImage, spawn, rename, rm, log, openSharp } =
    await loadDecoder({ mode: 'exit' });
  await expect(ensureDecodedImage(file)).rejects.toThrow('invalid JPEG XL');
  await expect(ensureDecodedImage(file)).rejects.toThrow(
    'Previous magick decode failure',
  );
  expect(spawn).toHaveBeenCalledOnce();
  expect(openSharp).not.toHaveBeenCalled();
  expect(rename).not.toHaveBeenCalled();
  expect(rm).toHaveBeenCalledWith(expect.stringMatching(/\.1\.tmp\.png$/), {
    force: true,
  });
  expect(rm).toHaveBeenLastCalledWith(expect.stringMatching(/\.0\.tmp\.png$/), {
    force: true,
  });
  expect(log).toHaveBeenCalledOnce();
  expect(log).toHaveBeenCalledWith(
    'error',
    expect.stringContaining('Unable to decode portrait.JXL with magick'),
  );
});

test('a successful process cannot publish an intermediate without usable dimensions', async () => {
  const { ensureDecodedImage, rename, rm } = await loadDecoder({
    valid: false,
  });
  await expect(ensureDecodedImage(file)).rejects.toThrow(
    'decoded image output had no dimensions',
  );
  expect(rename).not.toHaveBeenCalled();
  expect(rm).toHaveBeenCalledWith(expect.stringMatching(/\.1\.tmp\.png$/), {
    force: true,
  });
  expect(rm).toHaveBeenLastCalledWith(expect.stringMatching(/\.0\.tmp\.png$/), {
    force: true,
  });
});

test('a hung JXL decoder is killed before both temporary files are removed', async () => {
  vi.useFakeTimers();
  const { ensureDecodedImage, rename, rm, kill } = await loadDecoder({
    mode: 'timeout',
  });
  const rejected = expect(ensureDecodedImage(file)).rejects.toThrow(
    'timed out after 30000ms',
  );
  await vi.advanceTimersByTimeAsync(30_000);
  await rejected;
  expect(kill).toHaveBeenCalledWith('SIGKILL');
  expect(rename).not.toHaveBeenCalled();
  expect(rm).toHaveBeenCalledWith(expect.stringMatching(/\.1\.tmp\.png$/), {
    force: true,
  });
  expect(rm).toHaveBeenLastCalledWith(expect.stringMatching(/\.0\.tmp\.png$/), {
    force: true,
  });
});
