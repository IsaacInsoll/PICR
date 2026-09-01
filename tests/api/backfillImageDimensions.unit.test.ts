import { afterEach, expect, test, vi } from 'vitest';
import type { FileFields } from '../../backend/db/picrDb.js';

// `vi.doMock('drizzle-orm', ...)` below does not intercept in the unit lane, so
// `where` reaches the query mocks as a real Drizzle `SQL` object rather than the
// plain shape that factory returns. Walk its chunks for the keyset bound: the
// only condition pairing the id column with a numeric parameter is
// `gt(dbFile.id, afterId)`.
const keysetCursor = (node: unknown, idColumn: string): number | undefined => {
  const chunks = (node as { queryChunks?: unknown[] } | null)?.queryChunks;
  if (!Array.isArray(chunks)) return undefined;

  const idIndex = chunks.indexOf(idColumn);
  if (idIndex !== -1) {
    const bound = chunks
      .slice(idIndex + 1)
      .find((chunk) => typeof chunk === 'number');
    if (typeof bound === 'number') return bound;
  }

  for (const chunk of chunks) {
    const nested = keysetCursor(chunk, idColumn);
    if (nested !== undefined) return nested;
  }
  return undefined;
};

const baseFile = (overrides: Partial<FileFields> = {}): FileFields =>
  ({
    blurHash: 'blurhash',
    createdAt: new Date('2026-08-10T00:00:00.000Z'),
    duration: null,
    exists: true,
    existsRescan: true,
    fileCreated: new Date('2026-08-10T00:00:00.000Z'),
    fileHash: 'hash',
    fileLastModified: new Date('2026-08-10T00:00:00.000Z'),
    fileSize: 1024,
    flag: null,
    folderId: 10,
    id: 1,
    imageWidth: null,
    imageHeight: null,
    imageRatio: null,
    latestComment: null,
    metadata: '{}',
    name: 'image.jpg',
    rating: 0,
    relativePath: 'folder',
    stIno: null,
    totalComments: 0,
    type: 'Image',
    updatedAt: new Date('2026-08-10T00:00:00.000Z'),
    ...overrides,
  }) satisfies FileFields;

const loadBackfill = async ({
  ensureDecodedImageImpl = async () => '/cache/decoded.jpg',
  existsSyncImpl = () => true,
  files = [baseFile()],
  videoMetadataImpl = async () => ({
    Duration: 12.5,
    Width: 1080,
    Height: 1920,
  }),
}: {
  ensureDecodedImageImpl?: (file: FileFields) => Promise<string>;
  existsSyncImpl?: (path: string) => boolean;
  files?: FileFields[];
  videoMetadataImpl?: (file: FileFields) => Promise<Record<string, unknown>>;
} = {}) => {
  vi.resetModules();

  const columns = {
    dbFile: {
      exists: 'Files.exists',
      fileHash: 'Files.fileHash',
      id: 'Files.id',
      imageHeight: 'Files.imageHeight',
      imageWidth: 'Files.imageWidth',
      name: 'Files.name',
      relativePath: 'Files.relativePath',
      type: 'Files.type',
    },
  };
  const ensureDecodedImage = vi.fn(ensureDecodedImageImpl);
  const log = vi.fn();
  const getVideoMetadata = vi.fn(videoMetadataImpl);
  const getImageMetadataAndDimensions = vi.fn(async () => ({
    dimensions: { width: 4000, height: 3000 },
    imageRatio: 4 / 3,
    metadata: { Camera: 'mock camera', Width: 4000, Height: 3000 },
  }));

  vi.doMock('node:fs', () => ({
    existsSync: vi.fn(existsSyncImpl),
  }));
  const selectBuilder = {
    from: vi.fn(() => selectBuilder),
    where: vi.fn(async () => [{ count: files.length }]),
  };
  // Honour the keyset cursor rather than paging on a counter of our own. Rows
  // that fail or are skipped still match the backfill predicate, so if the
  // cursor is ever dropped — or `lastSeenId` stops advancing — an uncursored
  // query returns them forever. Reading the cursor here is what makes that
  // regression fail the test instead of only hanging in production.
  // Rows that fail or are skipped keep matching the backfill predicate, so a
  // query that loses its keyset cursor returns them forever. Paging off the
  // cursor makes that regression observable here; the batch cap turns it into a
  // fast assertion instead of a hung worker.
  let batchesServed = 0;
  const findMany = vi.fn(
    async ({ limit, where }: { limit: number; where: unknown }) => {
      const cursor = keysetCursor(where, columns.dbFile.id);
      if (++batchesServed > Math.ceil(files.length / limit) + 1) {
        throw new Error(
          `Backfill requested more batches than rows require; keyset cursor is not advancing (last cursor: ${String(cursor)})`,
        );
      }
      return files
        .filter((file) => cursor === undefined || file.id > cursor)
        .slice(0, limit);
    },
  );
  const update = vi.fn(() => ({
    set: vi.fn((values: Partial<FileFields>) => ({
      where: vi.fn(async (where: { eq?: [string, unknown] }) => {
        const id = where.eq?.[1];
        const index = files.findIndex((file) => file.id === id);
        files[index === -1 ? 0 : index] = {
          ...files[index === -1 ? 0 : index],
          ...values,
        };
      }),
    })),
  }));

  vi.doMock('drizzle-orm', () => ({
    and: vi.fn((...conditions: unknown[]) => ({ and: conditions })),
    asc: vi.fn((column: string) => ({ asc: column })),
    count: vi.fn(() => 'count(*)'),
    eq: vi.fn((column: string, value: unknown) => ({ eq: [column, value] })),
    gt: vi.fn((column: string, value: unknown) => ({ gt: [column, value] })),
    inArray: vi.fn((column: string, values: unknown[]) => ({
      inArray: [column, values],
    })),
    isNull: vi.fn((column: string) => ({ isNull: column })),
    or: vi.fn((...conditions: unknown[]) => ({ or: conditions })),
    sql: vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({
      sql: [strings, values],
    })),
  }));
  vi.doMock('../../backend/db/models/index.js', () => columns);
  vi.doMock('../../backend/filesystem/fileManager.js', () => ({
    fullPathForFile: vi.fn(
      (file: FileFields) => `/media/${file.relativePath}/${file.name}`,
    ),
  }));
  vi.doMock('../../backend/media/ensureDecodedImage.js', () => ({
    ensureDecodedImage,
  }));
  vi.doMock('../../backend/media/getImageMetadata.js', () => ({
    getImageMetadataAndDimensions,
  }));
  vi.doMock('../../backend/media/getVideoMetadata.js', () => ({
    getVideoMetadata,
  }));
  vi.doMock('../../backend/logger.js', () => ({ log }));
  vi.doMock('../../backend/db/picrDb.js', () => ({
    db: {
      query: {
        dbFile: {
          findMany,
        },
      },
      select: vi.fn(() => selectBuilder),
      update,
    },
  }));

  const { backfillImageDimensions } =
    await import('../../backend/boot/backfillImageDimensions.js');

  return {
    backfillImageDimensions,
    ensureDecodedImage,
    files,
    findMany,
    getImageMetadataAndDimensions,
    getVideoMetadata,
    log,
    update,
  };
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

test('backfills dimensions and derives imageRatio for active image rows', async () => {
  const { backfillImageDimensions, files, getImageMetadataAndDimensions, log } =
    await loadBackfill();

  await expect(backfillImageDimensions()).resolves.toEqual({
    backfilled: 1,
    failed: 0,
    skippedMissing: 0,
  });

  expect(getImageMetadataAndDimensions).toHaveBeenCalledWith(
    expect.objectContaining({ id: 1, imageWidth: null, imageHeight: null }),
    '/cache/decoded.jpg',
  );
  expect(files[0]).toMatchObject({
    imageWidth: 4000,
    imageHeight: 3000,
    imageRatio: 4 / 3,
    metadata: '{"Camera":"mock camera","Width":4000,"Height":3000}',
    type: 'Image',
  });
  expect(log).toHaveBeenCalledWith(
    'info',
    expect.stringContaining('1 media row(s) backfilled in'),
    true,
  );
});

test('probes video rows for dimensions instead of decoding them', async () => {
  const {
    backfillImageDimensions,
    ensureDecodedImage,
    files,
    getVideoMetadata,
  } = await loadBackfill({
    files: [baseFile({ id: 1, name: 'clip.mp4', type: 'Video' })],
  });

  await expect(backfillImageDimensions()).resolves.toEqual({
    backfilled: 1,
    failed: 0,
    skippedMissing: 0,
  });

  expect(ensureDecodedImage).not.toHaveBeenCalled();
  expect(getVideoMetadata).toHaveBeenCalledWith(
    expect.objectContaining({ id: 1, type: 'Video' }),
  );
  // Rewriting the summary is what repairs rotated videos scanned before
  // displayed dimensions were corrected, so the portrait stays portrait.
  expect(files[0]).toMatchObject({
    imageWidth: 1080,
    imageHeight: 1920,
    imageRatio: 1080 / 1920,
    duration: 12.5,
    metadata: '{"Duration":12.5,"Width":1080,"Height":1920}',
  });
});

test('leaves a video row unchanged when ffprobe reports no video stream', async () => {
  const { backfillImageDimensions, files, log } = await loadBackfill({
    files: [baseFile({ id: 1, name: 'audio-only.mp4', type: 'Video' })],
    videoMetadataImpl: async () => ({ Duration: 3 }),
  });

  await expect(backfillImageDimensions()).resolves.toEqual({
    backfilled: 0,
    failed: 1,
    skippedMissing: 0,
  });

  expect(files[0]).toMatchObject({ imageWidth: null, imageHeight: null });
  expect(log).toHaveBeenCalledWith(
    'error',
    expect.stringContaining('no usable video dimensions'),
  );
});

test('does not log when no media rows need dimension backfill', async () => {
  const { backfillImageDimensions, log } = await loadBackfill({ files: [] });

  await expect(backfillImageDimensions()).resolves.toEqual({
    backfilled: 0,
    failed: 0,
    skippedMissing: 0,
  });

  expect(log).not.toHaveBeenCalled();
});

test('selects only the columns needed to backfill dimensions', async () => {
  const { backfillImageDimensions, findMany } = await loadBackfill();

  await backfillImageDimensions();

  expect(findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      columns: {
        fileHash: true,
        id: true,
        name: true,
        relativePath: true,
        type: true,
      },
      limit: 250,
    }),
  );
});

test('leaves present images unchanged when they cannot be decoded during backfill', async () => {
  const { backfillImageDimensions, files, update } = await loadBackfill({
    ensureDecodedImageImpl: async () => {
      throw new Error('decode failed');
    },
  });

  await expect(backfillImageDimensions()).resolves.toEqual({
    backfilled: 0,
    failed: 1,
    skippedMissing: 0,
  });

  expect(files[0]).toMatchObject({
    imageWidth: null,
    imageHeight: null,
    imageRatio: null,
    metadata: '{}',
    type: 'Image',
  });
  expect(update).not.toHaveBeenCalled();
});

test('skips missing source files so an unavailable media mount is not destructive', async () => {
  const { backfillImageDimensions, ensureDecodedImage, files } =
    await loadBackfill({
      existsSyncImpl: () => false,
    });

  await expect(backfillImageDimensions()).resolves.toEqual({
    backfilled: 0,
    failed: 0,
    skippedMissing: 1,
  });

  expect(ensureDecodedImage).not.toHaveBeenCalled();
  expect(files[0]).toMatchObject({
    imageWidth: null,
    imageHeight: null,
    imageRatio: null,
    type: 'Image',
  });
});

test('pages by id so failed and missing rows do not stall the backfill', async () => {
  const files = Array.from({ length: 251 }, (_, index) =>
    baseFile({
      id: index + 1,
      name: `image-${index + 1}.jpg`,
    }),
  );
  const { backfillImageDimensions, ensureDecodedImage, findMany } =
    await loadBackfill({
      ensureDecodedImageImpl: async (file) => {
        if (file.id === 1) throw new Error('decode failed');
        return `/cache/${file.id}.jpg`;
      },
      existsSyncImpl: (path) => !path.endsWith('/image-2.jpg'),
      files,
    });

  await expect(backfillImageDimensions()).resolves.toEqual({
    backfilled: 249,
    failed: 1,
    skippedMissing: 1,
  });

  expect(ensureDecodedImage).toHaveBeenCalledTimes(250);
  expect(findMany).toHaveBeenCalledTimes(3);
  expect(findMany).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({ limit: 250 }),
  );
  expect(findMany).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({ limit: 250 }),
  );
  expect(findMany).toHaveBeenNthCalledWith(
    3,
    expect.objectContaining({ limit: 250 }),
  );
});
