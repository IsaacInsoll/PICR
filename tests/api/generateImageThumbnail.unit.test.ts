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
  const encodeImageThumbnailVariants = vi.fn(
    async (_input: string, variants: readonly { token: string }[]) =>
      new Map(variants.map((variant) => [variant.token, [{ width: 250 }]])),
  );
  const ensureDecodedImage = vi.fn(async () => '/cache/decoded.jpg');

  vi.doMock('../../backend/filesystem/fileManager.js', () => ({
    fullPath: vi.fn((relativePath: string) => `/media/${relativePath}`),
  }));
  vi.doMock('node:fs', async (importOriginal) => ({
    ...(await importOriginal<typeof import('node:fs')>()),
    existsSync: vi.fn((path: string) =>
      existingThumbnails.some((cacheKey) => path.includes(`-${cacheKey}-`)),
    ),
  }));
  vi.doMock('../../backend/logger.js', () => ({ log: vi.fn() }));
  vi.doMock('../../backend/media/encodeImageThumbnails.js', () => ({
    encodeImageThumbnailVariants,
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
      thumbnailJpegQuality: 80,
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
    thumbnailVariantPath: vi.fn(
      (
        thumbnailFile: Pick<MockFileRow, 'fileHash' | 'name' | 'relativePath'>,
        variant: { extension: string; token: string },
      ) =>
        `/cache/thumbs/${thumbnailFile.relativePath}/${thumbnailFile.name}-${variant.token}-${thumbnailFile.fileHash}${variant.extension}`,
    ),
  }));

  const module = await import('../../backend/media/generateImageThumbnail.js');
  return {
    encodeImageThumbnailVariants,
    encodeImageThumbnails,
    ensureDecodedImage,
    module,
  };
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

test('dedupes image thumbnail variants by concrete token', async () => {
  const { encodeImageThumbnailVariants, module } =
    await loadGenerateImageThumbnail();
  const variant = {
    cacheVersion: 'v1',
    extension: '.jpg',
    format: 'jpeg',
    generationPolicy: 'eager',
    letter: 'j',
    mimeType: 'image/jpeg',
    quality: 80,
    token: 'v1-1000j80',
    width: 1000,
  };

  await Promise.all([
    module.generateThumbnailVariant(file(), variant),
    module.generateThumbnailVariant(file(), variant),
  ]);

  expect(encodeImageThumbnailVariants).toHaveBeenCalledOnce();
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

test('decodes once for all missing image thumbnail variants', async () => {
  const { encodeImageThumbnailVariants, ensureDecodedImage, module } =
    await loadGenerateImageThumbnail();

  await module.generateAllThumbs(file());

  expect(ensureDecodedImage).toHaveBeenCalledOnce();
  expect(encodeImageThumbnailVariants).toHaveBeenCalledOnce();
  expect(encodeImageThumbnailVariants).toHaveBeenCalledWith(
    '/cache/decoded.jpg',
    expect.arrayContaining([
      expect.objectContaining({ token: 'v1-250j80', width: 250 }),
      expect.objectContaining({ token: 'v1-4000j80', width: 4000 }),
    ]),
    expect.any(Function),
  );
});

test('computes missing image thumbnail variants before decoding', async () => {
  const { encodeImageThumbnailVariants, ensureDecodedImage, module } =
    await loadGenerateImageThumbnail({ existingThumbnails: ['v1-250j80'] });

  await module.generateAllThumbs(file());

  expect(ensureDecodedImage).toHaveBeenCalledOnce();
  expect(encodeImageThumbnailVariants).toHaveBeenCalledWith(
    '/cache/decoded.jpg',
    expect.not.arrayContaining([
      expect.objectContaining({ token: 'v1-250j80' }),
    ]),
    expect.any(Function),
  );
});
