import { afterEach, expect, test, vi } from 'vitest';

const jpegPreview = Buffer.from([0xff, 0xd8, 1, 2, 3, 0xff, 0xd9]);
const corruptPreview = Buffer.from([1, 2, 3, 4, 5, 6]);
const exifWithPreview = (preview: Buffer, offset = 4) =>
  Buffer.concat([Buffer.from('Exif\0\0'), Buffer.alloc(offset), preview]);

const loadBlurHash = async ({
  preview = jpegPreview,
  rawFailures = new Set<unknown>(),
}: {
  preview?: Buffer | null;
  rawFailures?: Set<unknown>;
} = {}) => {
  vi.resetModules();

  const rawInputs: unknown[] = [];
  const rotated: unknown[] = [];
  const openSharp = vi.fn((input: unknown) => {
    const chain = {
      ensureAlpha: vi.fn(() => chain),
      raw: vi.fn(() => chain),
      resize: vi.fn(() => chain),
      rotate: vi.fn(() => {
        rotated.push(input);
        return chain;
      }),
      toBuffer: vi.fn(async () => {
        if (rawFailures.has(input)) {
          throw new Error('decode failed');
        }
        rawInputs.push(input);
        return {
          data: Buffer.alloc(32 * 32 * 4),
          info: { height: 32, width: 32 },
        };
      }),
    };
    return chain;
  });
  const embeddedExifJpegPreviewForImage = vi.fn(async () => preview);
  const log = vi.fn();

  vi.doMock('../../backend/media/exifPreview.js', () => ({
    embeddedExifJpegPreviewForImage,
  }));
  vi.doMock('../../backend/media/openSharp.js', () => ({ openSharp }));
  vi.doMock('../../backend/logger.js', () => ({ log }));

  const module = await import('../../backend/media/blurHash.js');
  return {
    embeddedExifJpegPreviewForImage,
    log,
    module,
    openSharp,
    rawInputs,
    rotated,
  };
};

const loadExifPreview = async ({
  exif = exifWithPreview(jpegPreview),
  sourceMetadata = { height: 200, width: 400 },
  previewMetadata = { height: 100, width: 200 },
}: {
  exif?: Buffer | null;
  sourceMetadata?: { height?: number; orientation?: number; width?: number };
  previewMetadata?: { height?: number; width?: number };
} = {}) => {
  vi.resetModules();
  vi.doUnmock('../../backend/media/exifPreview.js');

  const openSharp = vi.fn((input: unknown) => {
    const chain = {
      metadata: vi.fn(async () => {
        if (Buffer.isBuffer(input)) return previewMetadata;
        return { ...sourceMetadata, exif };
      }),
    };
    return chain;
  });

  vi.doMock('../../backend/media/openSharp.js', () => ({ openSharp }));

  const module = await import('../../backend/media/exifPreview.js');
  return { module, openSharp };
};

const validExifReaderResult = (length = jpegPreview.length, offset = 4) => ({
  Thumbnail: {
    Compression: 6,
    JPEGInterchangeFormat: offset,
    JPEGInterchangeFormatLength: length,
  },
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

test('uses an embedded EXIF JPEG preview for image blurhashes', async () => {
  const { embeddedExifJpegPreviewForImage, module, rawInputs } =
    await loadBlurHash();

  await expect(
    module.encodeImageToBlurhash('/media/photo.jpg'),
  ).resolves.not.toBe('');

  expect(embeddedExifJpegPreviewForImage).toHaveBeenCalledWith(
    '/media/photo.jpg',
  );
  expect(rawInputs).toEqual([jpegPreview]);
});

test('falls back to full image decode when there is no EXIF preview', async () => {
  const { module, rawInputs, rotated } = await loadBlurHash({ preview: null });

  await expect(
    module.encodeImageToBlurhash('/media/photo.jpg'),
  ).resolves.not.toBe('');

  expect(rawInputs).toEqual(['/media/photo.jpg']);
  // Rotated sources only ever reach this path, so it must auto-orient to match
  // the pre-rotated thumbnail and the oriented imageRatio.
  expect(rotated).toEqual(['/media/photo.jpg']);
});

test('falls back to full image decode when preview decoding fails', async () => {
  const { module, rawInputs } = await loadBlurHash({
    rawFailures: new Set([jpegPreview]),
  });

  await expect(
    module.encodeImageToBlurhash('/media/photo.jpg'),
  ).resolves.not.toBe('');

  expect(rawInputs).toEqual(['/media/photo.jpg']);
});

test('returns an empty blurhash and logs when full image decode fails', async () => {
  const { log, module } = await loadBlurHash({
    preview: null,
    rawFailures: new Set(['/media/photo.jpg']),
  });

  await expect(module.encodeImageToBlurhash('/media/photo.jpg')).resolves.toBe(
    '',
  );

  expect(log).toHaveBeenCalledWith(
    'error',
    'Failed to create blurhash for "/media/photo.jpg": decode failed',
  );
});

test('extractExifJpegPreview returns a JPEG IFD1 preview', async () => {
  const { module } = await loadExifPreview();

  expect(
    module.extractExifJpegPreview(exifWithPreview(jpegPreview), () =>
      validExifReaderResult(),
    ),
  ).toEqual(jpegPreview);
});

test('extractExifJpegPreview rejects non-JPEG compression', async () => {
  const { module } = await loadExifPreview();

  expect(
    module.extractExifJpegPreview(exifWithPreview(jpegPreview), () => ({
      Thumbnail: {
        ...validExifReaderResult().Thumbnail,
        Compression: 1,
      },
    })),
  ).toBeNull();
});

test('extractExifJpegPreview rejects corrupt preview bytes', async () => {
  const { module } = await loadExifPreview();

  expect(
    module.extractExifJpegPreview(exifWithPreview(corruptPreview), () =>
      validExifReaderResult(corruptPreview.length),
    ),
  ).toBeNull();
});

test('extractExifJpegPreview rejects out-of-range EXIF offsets', async () => {
  const { module } = await loadExifPreview();

  expect(
    module.extractExifJpegPreview(exifWithPreview(jpegPreview), () =>
      validExifReaderResult(jpegPreview.length, 5000),
    ),
  ).toBeNull();
});

test('embeddedExifJpegPreviewForImage rejects files without EXIF', async () => {
  const { module } = await loadExifPreview({ exif: null });

  await expect(
    module.embeddedExifJpegPreviewForImage('/media/photo.jpg', {
      readExif: () => validExifReaderResult(),
    }),
  ).resolves.toBeNull();
});

test('embeddedExifJpegPreviewForImage returns valid same-aspect EXIF previews', async () => {
  const { module } = await loadExifPreview();

  await expect(
    module.embeddedExifJpegPreviewForImage('/media/photo.jpg', {
      readExif: () => validExifReaderResult(),
    }),
  ).resolves.toEqual(jpegPreview);
});

test('embeddedExifJpegPreviewForImage rejects mismatched preview aspect ratios', async () => {
  const { module } = await loadExifPreview({
    previewMetadata: { height: 200, width: 100 },
  });

  await expect(
    module.embeddedExifJpegPreviewForImage('/media/photo.jpg', {
      readExif: () => validExifReaderResult(),
    }),
  ).resolves.toBeNull();
});

test('embeddedExifJpegPreviewForImage accepts explicitly unrotated sources', async () => {
  const { module } = await loadExifPreview({
    sourceMetadata: { height: 200, orientation: 1, width: 400 },
  });

  await expect(
    module.embeddedExifJpegPreviewForImage('/media/photo.jpg', {
      readExif: () => validExifReaderResult(),
    }),
  ).resolves.toEqual(jpegPreview);
});

// An extracted IFD1 preview carries no EXIF, so `.rotate()` cannot orient it.
// Rejecting rotated sources forces them down the full-decode path rather than
// letting preview availability decide whether the hash is oriented.
test('embeddedExifJpegPreviewForImage rejects previews from rotated sources', async () => {
  for (const orientation of [2, 3, 4, 5, 6, 7, 8]) {
    const { module } = await loadExifPreview({
      sourceMetadata: { height: 200, orientation, width: 400 },
    });

    await expect(
      module.embeddedExifJpegPreviewForImage('/media/photo.jpg', {
        readExif: () => validExifReaderResult(),
      }),
    ).resolves.toBeNull();
  }
});
