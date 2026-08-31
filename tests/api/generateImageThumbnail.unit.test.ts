import { afterEach, expect, test, vi } from 'vitest';

interface MockFileRow {
  id: number;
  name: string;
  relativePath: string;
  fileHash: string | null;
  type: 'Image';
}

const file = (overrides: Partial<MockFileRow> = {}): MockFileRow => ({
  fileHash: 'hash-a',
  id: 7,
  name: 'IMG_0001.jpg',
  relativePath: 'exports',
  type: 'Image',
  ...overrides,
});

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
};

const loadGenerateImageThumbnail = async ({
  encodeImageThumbnailsImpl,
  existingThumbnails = [],
}: {
  encodeImageThumbnailsImpl?: (
    input: string,
    sizes: readonly string[],
  ) => Promise<Map<string, unknown[] | null>>;
  existingThumbnails?: string[];
} = {}) => {
  vi.resetModules();

  const encodeImageThumbnails = vi.fn(
    encodeImageThumbnailsImpl ??
      (async (_input: string, sizes: readonly string[]) =>
        new Map(sizes.map((size) => [size, [{ width: 250 }]]))),
  );
  const ensureDecodedImage = vi.fn(async () => '/cache/decoded.jpg');

  vi.doMock('../../backend/filesystem/fileManager.js', () => ({
    fullPath: vi.fn((relativePath: string) => `/media/${relativePath}`),
  }));
  vi.doMock('node:fs', async (importOriginal) => ({
    ...(await importOriginal<typeof import('node:fs')>()),
    existsSync: vi.fn((path: string) =>
      existingThumbnails.some((size) => path.includes(`-${size}-`)),
    ),
  }));
  vi.doMock('../../backend/logger.js', () => ({ log: vi.fn() }));
  vi.doMock('../../backend/media/encodeImageThumbnails.js', () => ({
    encodeImageThumbnails,
  }));
  vi.doMock('../../backend/media/ensureDecodedImage.js', () => ({
    ensureDecodedImage,
  }));
  vi.doMock('../../backend/media/generateVideoThumbnail.js', () => ({
    generateVideoThumbnail: vi.fn(),
  }));
  vi.doMock('../../backend/media/serverMediaSettings.js', () => ({
    getServerMediaSettings: vi.fn(async () => ({
      thumbnailJpegQuality: 60,
      thumbnailLargePx: 2500,
      thumbnailMediumPx: 500,
      thumbnailSmallPx: 250,
    })),
  }));
  vi.doMock('../../backend/media/thumbnailPath.js', () => ({
    thumbnailPath: vi.fn(
      (
        thumbnailFile: Pick<MockFileRow, 'fileHash' | 'name' | 'relativePath'>,
        size: string,
        extension = '.jpg',
      ) =>
        `/cache/thumbs/${thumbnailFile.relativePath}/${thumbnailFile.name}-${size}-${thumbnailFile.fileHash}${extension}`,
    ),
  }));

  const module = await import('../../backend/media/generateImageThumbnail.js');
  return { encodeImageThumbnails, ensureDecodedImage, module };
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

test('dedupes concurrent image thumbnail generation for the same file hash and size', async () => {
  const encodeStarted = deferred();
  const finishEncode = deferred();
  const { encodeImageThumbnails, ensureDecodedImage, module } =
    await loadGenerateImageThumbnail({
      encodeImageThumbnailsImpl: async (_input, sizes) => {
        encodeStarted.resolve();
        await finishEncode.promise;
        return new Map(sizes.map((size) => [size, [{ width: 500 }]]));
      },
    });

  const first = module.generateThumbnail(file(), 'md');
  await encodeStarted.promise;
  const second = module.generateThumbnail(file(), 'md');

  finishEncode.resolve();
  await expect(Promise.all([first, second])).resolves.toEqual([
    [{ width: 500 }],
    [{ width: 500 }],
  ]);

  expect(ensureDecodedImage).toHaveBeenCalledOnce();
  expect(encodeImageThumbnails).toHaveBeenCalledOnce();
});

test('does not dedupe different thumbnail sizes together', async () => {
  const { encodeImageThumbnails, module } = await loadGenerateImageThumbnail();

  await Promise.all([
    module.generateThumbnail(file(), 'sm'),
    module.generateThumbnail(file(), 'md'),
  ]);

  expect(encodeImageThumbnails).toHaveBeenCalledTimes(2);
});

test('does not dedupe different file hashes together', async () => {
  const { encodeImageThumbnails, module } = await loadGenerateImageThumbnail();

  await Promise.all([
    module.generateThumbnail(file({ fileHash: 'hash-a' }), 'md'),
    module.generateThumbnail(file({ fileHash: 'hash-b' }), 'md'),
  ]);

  expect(encodeImageThumbnails).toHaveBeenCalledTimes(2);
});

test('clears failed image thumbnail generation so a later retry can run', async () => {
  const encodeImageThumbnails = vi
    .fn()
    .mockRejectedValueOnce(new Error('disk full'))
    .mockResolvedValueOnce(new Map([['md', [{ width: 500 }]]]));
  const { module } = await loadGenerateImageThumbnail({
    encodeImageThumbnailsImpl: encodeImageThumbnails,
  });

  await expect(module.generateThumbnail(file(), 'md')).resolves.toBeNull();
  await expect(module.generateThumbnail(file(), 'md')).resolves.toEqual([
    { width: 500 },
  ]);

  expect(encodeImageThumbnails).toHaveBeenCalledTimes(2);
});

test('decodes once for all missing image thumbnail sizes', async () => {
  const { encodeImageThumbnails, ensureDecodedImage, module } =
    await loadGenerateImageThumbnail();

  await module.generateAllThumbs(file());

  expect(ensureDecodedImage).toHaveBeenCalledOnce();
  expect(encodeImageThumbnails).toHaveBeenCalledOnce();
  expect(encodeImageThumbnails).toHaveBeenCalledWith(
    '/cache/decoded.jpg',
    ['sm', 'md', 'lg'],
    expect.any(Function),
    {
      settings: {
        thumbnailJpegQuality: 60,
        thumbnailLargePx: 2500,
        thumbnailMediumPx: 500,
        thumbnailSmallPx: 250,
      },
    },
  );
});

test('computes missing image thumbnail sizes before decoding', async () => {
  const { encodeImageThumbnails, ensureDecodedImage, module } =
    await loadGenerateImageThumbnail({ existingThumbnails: ['sm'] });

  await module.generateAllThumbs(file());

  expect(ensureDecodedImage).toHaveBeenCalledOnce();
  expect(encodeImageThumbnails).toHaveBeenCalledWith(
    '/cache/decoded.jpg',
    ['md', 'lg'],
    expect.any(Function),
    expect.any(Object),
  );
});
