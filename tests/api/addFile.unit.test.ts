import { afterEach, expect, test, vi } from 'vitest';
import { contentHashForStats } from '../../backend/filesystem/fileHash';

interface MockFileRow {
  id: number;
  name: string;
  folderId: number;
  relativePath: string;
  fileHash: string | null;
  type: 'File' | 'Image' | 'Video';
  fileSize: number;
  fileCreated: Date;
  fileLastModified: Date;
  exists: boolean;
  existsRescan: boolean;
  totalComments: number;
  createdAt: Date;
  updatedAt: Date;
  rating: number;
  metadata?: string | null;
  blurHash?: string | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
  imageRatio?: number | null;
  duration?: number | null;
  stIno?: bigint | null;
  flag?: 'approved' | 'none' | 'rejected' | null;
  latestComment?: Date | null;
}

const mediaRoot = '/media';
const filePath = `${mediaRoot}/exports/IMG_0001.txt`;

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
};

const loadAddFile = async ({
  initialFiles = [],
  updateMetadata = false,
  sharpReadable = false,
  ensureDecodedImageImpl,
}: {
  initialFiles?: MockFileRow[];
  updateMetadata?: boolean;
  sharpReadable?: boolean;
  ensureDecodedImageImpl?: (file: MockFileRow) => Promise<string>;
} = {}) => {
  vi.resetModules();

  const files: MockFileRow[] = [...initialFiles];
  const insertStarted = deferred();
  const finishInsert = deferred();
  let nextFileId = Math.max(0, ...files.map((file) => file.id)) + 1;
  const addToQueue = vi.fn();
  const ensureDecodedImage = vi.fn(
    ensureDecodedImageImpl ?? (async () => `${mediaRoot}/decoded.jpg`),
  );
  const moveThumbnailFile = vi.fn();

  const columns = {
    dbFile: {
      exists: 'Files.exists',
      fileHash: 'Files.fileHash',
      folderId: 'Files.folderId',
      id: 'Files.id',
      name: 'Files.name',
      relativePath: 'Files.relativePath',
    },
    dbFolder: {
      bannerImageId: 'Folders.bannerImageId',
      exists: 'Folders.exists',
      heroImageId: 'Folders.heroImageId',
      id: 'Folders.id',
      relativePath: 'Folders.relativePath',
    },
    dbComment: {
      createdAt: 'Comments.createdAt',
      fileId: 'Comments.fileId',
      systemGenerated: 'Comments.systemGenerated',
    },
  };

  vi.doMock('drizzle-orm', () => ({
    and: vi.fn((...conditions: unknown[]) => ({ and: conditions })),
    eq: vi.fn((column: string, value: unknown) => ({ eq: [column, value] })),
    inArray: vi.fn((column: string, values: unknown[]) => ({
      inArray: [column, values],
    })),
    sql: vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({
      sql: [strings, values],
    })),
  }));
  vi.doMock('@shared/gql/graphql.js', () => ({
    FileType: {
      File: 'File',
      Image: 'Image',
      Video: 'Video',
    },
  }));
  vi.doMock('@shared/imageFormats.js', () => ({
    isHeicFormat: vi.fn(() => false),
    isPsbFormat: vi.fn(() => false),
    isPsdFormat: vi.fn(() => false),
    isRawFormat: vi.fn(() => false),
    isSharpReadableFormat: vi.fn(() => sharpReadable),
  }));
  vi.doMock('../../backend/db/models/index.js', () => columns);
  vi.doMock('../../backend/config/picrConfig.js', () => ({
    picrConfig: {
      mediaCaps: {
        heic: false,
        psb: false,
        psd: false,
        raw: false,
      },
      mediaPath: mediaRoot,
      updateMetadata,
    },
  }));
  vi.doMock('../../backend/filesystem/events/addFolder.js', () => ({
    addFolder: vi.fn(),
  }));
  vi.doMock('../../backend/filesystem/fileIdentity.js', () => ({
    findBestFileMatch: vi.fn(
      async ({
        folderId,
        name,
        relativePath,
      }: {
        folderId?: number;
        name: string;
        relativePath: string;
      }) =>
        files.find(
          (file) =>
            file.name === name &&
            file.relativePath === relativePath &&
            (folderId === undefined || file.folderId === folderId),
        ),
    ),
    mergeDuplicateFileRows: vi.fn(
      async (keeper: MockFileRow, duplicateRows: MockFileRow[]) => {
        keeper.flag =
          keeper.flag ??
          duplicateRows.find((file) => file.flag && file.flag !== 'none')
            ?.flag ??
          null;
        keeper.rating = Math.max(
          keeper.rating,
          ...duplicateRows.map((file) => file.rating),
        );
        const duplicateIds = new Set(duplicateRows.map((file) => file.id));
        for (const id of duplicateIds) {
          const index = files.findIndex((file) => file.id === id);
          if (index !== -1) files.splice(index, 1);
        }
      },
    ),
  }));
  vi.doMock('../../backend/logger.js', () => ({ log: vi.fn() }));
  vi.doMock('../../backend/media/blurHash.js', () => ({
    encodeImageToBlurhash: vi.fn(async () => 'mock-blurhash'),
  }));
  vi.doMock('../../backend/media/ensureDecodedImage.js', () => ({
    ensureDecodedImage,
  }));
  vi.doMock('../../backend/media/generateImageThumbnail.js', () => ({
    generateAllThumbs: vi.fn(),
  }));
  vi.doMock('../../backend/filesystem/fileQueue.js', () => ({
    addToQueue,
  }));
  vi.doMock('../../backend/media/getImageMetadata.js', () => ({
    getImageMetadataAndDimensions: vi.fn(async () => ({
      dimensions: { width: 3000, height: 2000 },
      imageRatio: 1.5,
      metadata: { Camera: 'mock camera', Width: 3000, Height: 2000 },
    })),
  }));
  vi.doMock('../../backend/media/getVideoMetadata.js', () => ({
    getVideoMetadata: vi.fn(async () => ({
      Duration: 12,
      Height: 720,
      Width: 1280,
    })),
  }));
  vi.doMock('../../backend/media/moveThumbnailFile.js', () => ({
    moveThumbnailFile,
  }));
  const updateFileFromWhere = (
    values: Partial<MockFileRow>,
    where: { eq?: [string, unknown] } | undefined,
  ) => {
    const id = where?.eq?.[0] === columns.dbFile.id ? where.eq[1] : values.id;
    const index = files.findIndex((file) => file.id === id);
    if (index !== -1) files[index] = { ...files[index], ...values };
  };
  vi.doMock('../../backend/db/picrDb.js', () => ({
    db: {
      insert: vi.fn(() => ({
        values: vi.fn((values: Omit<MockFileRow, 'id'>) => ({
          returning: vi.fn(async () => {
            insertStarted.resolve();
            await finishInsert.promise;
            const row: MockFileRow = { ...values, id: nextFileId++ };
            files.push(row);
            return [row];
          }),
        })),
      })),
      delete: vi.fn(() => ({
        where: vi.fn(async () => undefined),
      })),
      transaction: vi.fn(
        async (
          callback: (tx: {
            delete: typeof vi.fn;
            select: typeof vi.fn;
            update: typeof vi.fn;
          }) => Promise<void>,
        ) =>
          callback({
            delete: vi.fn(() => ({
              where: vi.fn(
                async (condition: { inArray?: [string, number[]] }) => {
                  const ids = condition.inArray?.[1] ?? [];
                  for (const id of ids) {
                    const index = files.findIndex((file) => file.id === id);
                    if (index !== -1) files.splice(index, 1);
                  }
                },
              ),
            })),
            select: vi.fn(() => ({
              from: vi.fn(() => ({
                where: vi.fn(async () => [
                  { totalComments: 0, latestComment: null },
                ]),
              })),
            })),
            update: vi.fn(() => ({
              set: vi.fn((values: Partial<MockFileRow>) => ({
                where: vi.fn(async (where: { eq?: [string, unknown] }) => {
                  updateFileFromWhere(values, where);
                }),
              })),
            })),
          }),
      ),
      query: {
        dbFile: {
          findMany: vi.fn(async () => files),
        },
        dbFolder: {
          findFirst: vi.fn(async () => ({ id: 23 })),
        },
      },
      update: vi.fn(() => ({
        set: vi.fn((values: MockFileRow) => ({
          where: vi.fn(async (where: { eq?: [string, unknown] }) => {
            updateFileFromWhere(values, where);
          }),
        })),
      })),
    },
  }));

  const { addFile } =
    await import('../../backend/filesystem/events/addFile.js');
  return {
    addToQueue,
    addFile,
    ensureDecodedImage,
    files,
    finishInsert,
    insertStarted: insertStarted.promise,
    moveThumbnailFile,
  };
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

test('queues thumbnail generation only after persisting a new image row', async () => {
  const stats = {
    birthtime: new Date('2026-08-10T00:00:00.000Z'),
    mtime: new Date('2026-08-10T00:00:00.000Z'),
    size: 1024,
  };
  const { addFile, addToQueue, files, finishInsert } = await loadAddFile({
    sharpReadable: true,
  });

  addToQueue.mockImplementation((action, payload) => {
    expect(action).toBe('generateThumbnails');
    expect(payload).toEqual({ id: 1 });
    expect(files[0]).toMatchObject({
      exists: true,
      existsRescan: true,
      fileHash: contentHashForStats(stats),
      imageWidth: 3000,
      imageHeight: 2000,
      imageRatio: 1.5,
      blurHash: 'mock-blurhash',
      type: 'Image',
    });
  });

  finishInsert.resolve();
  await addFile(`${mediaRoot}/exports/IMG_0001.jpg`, true, stats);

  expect(addToQueue).toHaveBeenCalledOnce();
});

test('does not queue thumbnail generation when image decoding fails', async () => {
  const stats = {
    birthtime: new Date('2026-08-10T00:00:00.000Z'),
    mtime: new Date('2026-08-10T00:00:00.000Z'),
    size: 1024,
  };
  const { addFile, addToQueue, files, finishInsert } = await loadAddFile({
    ensureDecodedImageImpl: async () => {
      throw new Error('decode failed');
    },
    sharpReadable: true,
  });

  finishInsert.resolve();
  await addFile(`${mediaRoot}/exports/IMG_0001.jpg`, true, stats);

  expect(addToQueue).not.toHaveBeenCalled();
  expect(files[0]).toMatchObject({
    exists: true,
    existsRescan: true,
    imageWidth: null,
    imageHeight: null,
    imageRatio: 0,
    metadata: null,
    blurHash: null,
    type: 'File',
  });
});

test('queues thumbnail generation only after persisting a new video row', async () => {
  const stats = {
    birthtime: new Date('2026-08-10T00:00:00.000Z'),
    mtime: new Date('2026-08-10T00:00:00.000Z'),
    size: 1024,
  };
  const { addFile, addToQueue, files, finishInsert } = await loadAddFile();

  addToQueue.mockImplementation((action, payload) => {
    expect(action).toBe('generateThumbnails');
    expect(payload).toEqual({ id: 1 });
    expect(files[0]).toMatchObject({
      duration: 12,
      exists: true,
      existsRescan: true,
      fileHash: contentHashForStats(stats),
      imageRatio: 1280 / 720,
      type: 'Video',
    });
  });

  finishInsert.resolve();
  await addFile(`${mediaRoot}/exports/clip.mp4`, true, stats);

  expect(addToQueue).toHaveBeenCalledOnce();
});

test('does not queue thumbnail generation for a pure image move', async () => {
  const stats = {
    birthtime: new Date('2026-08-10T00:00:00.000Z'),
    mtime: new Date('2026-08-10T00:00:00.000Z'),
    size: 1024,
  };
  const hash = contentHashForStats(stats);
  const { addFile, addToQueue, ensureDecodedImage, files, moveThumbnailFile } =
    await loadAddFile({
      initialFiles: [
        {
          blurHash: 'existing-blurhash',
          createdAt: new Date('2026-08-10T00:00:00.000Z'),
          exists: true,
          existsRescan: true,
          fileCreated: stats.birthtime,
          fileHash: hash,
          fileLastModified: stats.mtime,
          fileSize: stats.size,
          folderId: 23,
          id: 7,
          imageRatio: 1.5,
          metadata: '{"camera":"existing camera"}',
          name: 'old.jpg',
          rating: 0,
          relativePath: 'exports',
          totalComments: 0,
          type: 'Image',
          updatedAt: new Date('2026-08-10T00:00:00.000Z'),
        },
      ],
      sharpReadable: true,
    });

  await addFile(
    `${mediaRoot}/exports/IMG_0001.jpg`,
    true,
    stats,
    `${mediaRoot}/exports/old.jpg`,
  );

  expect(files).toHaveLength(1);
  expect(files[0]).toMatchObject({
    id: 7,
    name: 'IMG_0001.jpg',
    relativePath: 'exports',
  });
  expect(moveThumbnailFile).toHaveBeenCalledWith(
    'exports',
    'exports',
    'old.jpg',
    'IMG_0001.jpg',
    hash,
    'Image',
  );
  expect(ensureDecodedImage).not.toHaveBeenCalled();
  expect(addToQueue).not.toHaveBeenCalled();
});

test('does not queue thumbnail generation for a metadata-only image refresh', async () => {
  const stats = {
    birthtime: new Date('2026-08-10T00:00:00.000Z'),
    mtime: new Date('2026-08-10T00:00:00.000Z'),
    size: 1024,
  };
  const hash = contentHashForStats(stats);
  const { addFile, addToQueue, files } = await loadAddFile({
    initialFiles: [
      {
        blurHash: 'existing-blurhash',
        createdAt: new Date('2026-08-10T00:00:00.000Z'),
        exists: true,
        existsRescan: true,
        fileCreated: stats.birthtime,
        fileHash: hash,
        fileLastModified: stats.mtime,
        fileSize: stats.size,
        folderId: 23,
        id: 7,
        imageRatio: 1.5,
        metadata: '{"camera":"old camera"}',
        name: 'IMG_0001.jpg',
        rating: 0,
        relativePath: 'exports',
        totalComments: 0,
        type: 'Image',
        updatedAt: new Date('2026-08-10T00:00:00.000Z'),
      },
    ],
    sharpReadable: true,
    updateMetadata: true,
  });

  await addFile(`${mediaRoot}/exports/IMG_0001.jpg`, true, stats);

  expect(files[0]).toMatchObject({
    blurHash: 'existing-blurhash',
    exists: true,
    existsRescan: true,
    fileHash: hash,
    imageWidth: 3000,
    imageHeight: 2000,
    imageRatio: 1.5,
    metadata: '{"Camera":"mock camera","Width":3000,"Height":2000}',
    type: 'Image',
  });
  expect(addToQueue).not.toHaveBeenCalled();
});

test('queues thumbnail generation after persisting a changed image hash', async () => {
  const oldStats = {
    birthtime: new Date('2026-08-10T00:00:00.000Z'),
    mtime: new Date('2026-08-10T00:00:00.000Z'),
    size: 1024,
  };
  const newStats = {
    birthtime: new Date('2026-08-11T00:00:00.000Z'),
    mtime: new Date('2026-08-11T00:00:00.000Z'),
    size: 2048,
  };
  const { addFile, addToQueue, files } = await loadAddFile({
    initialFiles: [
      {
        blurHash: 'old-blurhash',
        createdAt: new Date('2026-08-10T00:00:00.000Z'),
        exists: true,
        existsRescan: true,
        fileCreated: oldStats.birthtime,
        fileHash: contentHashForStats(oldStats),
        fileLastModified: oldStats.mtime,
        fileSize: oldStats.size,
        folderId: 23,
        id: 7,
        imageRatio: 1.2,
        metadata: '{"camera":"old camera"}',
        name: 'IMG_0001.jpg',
        rating: 0,
        relativePath: 'exports',
        totalComments: 0,
        type: 'Image',
        updatedAt: new Date('2026-08-10T00:00:00.000Z'),
      },
    ],
    sharpReadable: true,
  });
  const newHash = contentHashForStats(newStats);

  addToQueue.mockImplementation((action, payload) => {
    expect(action).toBe('generateThumbnails');
    expect(payload).toEqual({ id: 7 });
    expect(files[0]).toMatchObject({
      blurHash: 'mock-blurhash',
      exists: true,
      existsRescan: true,
      fileHash: newHash,
      fileLastModified: newStats.mtime,
      imageWidth: 3000,
      imageHeight: 2000,
      imageRatio: 1.5,
      metadata: '{"Camera":"mock camera","Width":3000,"Height":2000}',
      type: 'Image',
    });
  });

  await addFile(`${mediaRoot}/exports/IMG_0001.jpg`, true, newStats);

  expect(addToQueue).toHaveBeenCalledOnce();
});

test('concurrent imports for the same path share the inserted file row', async () => {
  const { addFile, files, finishInsert, insertStarted } = await loadAddFile();
  const stats = {
    birthtime: new Date('2026-08-10T00:00:00.000Z'),
    mtime: new Date('2026-08-10T00:00:00.000Z'),
    size: 1024,
  };

  const first = addFile(filePath, false, stats);
  await insertStarted;
  const second = addFile(filePath, false, stats);

  finishInsert.resolve();
  await Promise.all([first, second]);

  expect(files).toHaveLength(1);
  expect(files[0]).toMatchObject({
    name: 'IMG_0001.txt',
    folderId: 23,
    relativePath: 'exports',
    exists: true,
    existsRescan: true,
  });
});

test('renames a source row when no destination row exists', async () => {
  const stats = {
    birthtime: new Date('2026-08-10T00:00:00.000Z'),
    mtime: new Date('2026-08-10T00:00:00.000Z'),
    size: 1024,
  };
  const { addFile, files, moveThumbnailFile } = await loadAddFile({
    initialFiles: [
      {
        createdAt: new Date('2026-08-10T00:00:00.000Z'),
        exists: true,
        existsRescan: true,
        fileCreated: stats.birthtime,
        fileHash: contentHashForStats(stats),
        fileLastModified: stats.mtime,
        fileSize: stats.size,
        folderId: 23,
        id: 7,
        name: 'old.txt',
        rating: 0,
        relativePath: 'exports',
        totalComments: 0,
        type: 'File',
        updatedAt: new Date('2026-08-10T00:00:00.000Z'),
      },
    ],
  });

  await addFile(filePath, false, stats, `${mediaRoot}/exports/old.txt`);

  expect(files).toHaveLength(1);
  expect(files[0]).toMatchObject({
    id: 7,
    name: 'IMG_0001.txt',
    relativePath: 'exports',
  });
  expect(moveThumbnailFile).toHaveBeenCalledWith(
    'exports',
    'exports',
    'old.txt',
    'IMG_0001.txt',
    contentHashForStats(stats),
    'File',
  );
});

test('merges a rename source row into an existing destination row', async () => {
  const stats = {
    birthtime: new Date('2026-08-10T00:00:00.000Z'),
    mtime: new Date('2026-08-10T00:00:00.000Z'),
    size: 1024,
  };
  const hash = contentHashForStats(stats);
  const baseRow = {
    createdAt: new Date('2026-08-10T00:00:00.000Z'),
    exists: true,
    existsRescan: true,
    fileCreated: stats.birthtime,
    fileHash: hash,
    fileLastModified: stats.mtime,
    fileSize: stats.size,
    folderId: 23,
    rating: 0,
    relativePath: 'exports',
    totalComments: 0,
    type: 'File' as const,
    updatedAt: new Date('2026-08-10T00:00:00.000Z'),
  };
  const { addFile, files, moveThumbnailFile } = await loadAddFile({
    initialFiles: [
      {
        ...baseRow,
        id: 1,
        name: 'IMG_0001.txt',
      },
      {
        ...baseRow,
        flag: 'approved',
        id: 2,
        name: 'old.txt',
        rating: 4,
      },
    ],
  });

  await addFile(filePath, false, stats, `${mediaRoot}/exports/old.txt`);

  expect(files).toHaveLength(1);
  expect(files[0]).toMatchObject({
    flag: 'approved',
    id: 1,
    name: 'IMG_0001.txt',
    rating: 4,
    relativePath: 'exports',
  });
  expect(moveThumbnailFile).not.toHaveBeenCalled();
});
