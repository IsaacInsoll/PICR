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
  encodeImageThumbnailVariantsImpl,
  existingThumbnails = [],
}: {
  encodeImageThumbnailVariantsImpl?: (
    input: string,
    variants: readonly { token: string }[],
  ) => Promise<Map<string, unknown[] | null>>;
  existingThumbnails?: string[];
} = {}) => {
  vi.resetModules();

  const encodeImageThumbnailVariants = vi.fn(
    encodeImageThumbnailVariantsImpl ??
      (async (_input: string, variants: readonly { token: string }[]) =>
        new Map(variants.map((variant) => [variant.token, [{ width: 250 }]]))),
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
    ensureDecodedImage,
    module,
  };
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

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

test('dedupes concurrent image thumbnail generation for the same file hash and token', async () => {
  const encodeStarted = deferred();
  const finishEncode = deferred();
  const { encodeImageThumbnailVariants, ensureDecodedImage, module } =
    await loadGenerateImageThumbnail({
      encodeImageThumbnailVariantsImpl: async (_input, variants) => {
        encodeStarted.resolve();
        await finishEncode.promise;
        return new Map(
          variants.map((variant) => [variant.token, [{ width: 500 }]]),
        );
      },
    });

  const first = module.generateThumbnailVariant(file(), variant);
  await encodeStarted.promise;
  const second = module.generateThumbnailVariant(file(), variant);

  finishEncode.resolve();
  await expect(Promise.all([first, second])).resolves.toEqual([
    [{ width: 500 }],
    [{ width: 500 }],
  ]);

  expect(ensureDecodedImage).toHaveBeenCalledOnce();
  expect(encodeImageThumbnailVariants).toHaveBeenCalledOnce();
});

test('does not dedupe different file hashes together', async () => {
  const { encodeImageThumbnailVariants, module } =
    await loadGenerateImageThumbnail();

  await Promise.all([
    module.generateThumbnailVariant(file({ fileHash: 'hash-a' }), variant),
    module.generateThumbnailVariant(file({ fileHash: 'hash-b' }), variant),
  ]);

  expect(encodeImageThumbnailVariants).toHaveBeenCalledTimes(2);
});

test('dedupes image thumbnail variants by concrete token', async () => {
  const { encodeImageThumbnailVariants, module } =
    await loadGenerateImageThumbnail();

  await Promise.all([
    module.generateThumbnailVariant(file(), variant),
    module.generateThumbnailVariant(file(), variant),
  ]);

  expect(encodeImageThumbnailVariants).toHaveBeenCalledOnce();
});

test('clears failed image thumbnail generation so a later retry can run', async () => {
  const encodeImageThumbnailVariants = vi
    .fn()
    .mockRejectedValueOnce(new Error('disk full'))
    .mockResolvedValueOnce(new Map([[variant.token, [{ width: 500 }]]]));
  const { module } = await loadGenerateImageThumbnail({
    encodeImageThumbnailVariantsImpl: encodeImageThumbnailVariants,
  });

  await expect(
    module.generateThumbnailVariant(file(), variant),
  ).resolves.toBeNull();
  await expect(
    module.generateThumbnailVariant(file(), variant),
  ).resolves.toEqual([{ width: 500 }]);

  expect(encodeImageThumbnailVariants).toHaveBeenCalledTimes(2);
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
