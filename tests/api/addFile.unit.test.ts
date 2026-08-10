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
}: {
  initialFiles?: MockFileRow[];
} = {}) => {
  vi.resetModules();

  const files: MockFileRow[] = [...initialFiles];
  const insertStarted = deferred();
  const finishInsert = deferred();
  let nextFileId = Math.max(0, ...files.map((file) => file.id)) + 1;
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
    isSharpReadableFormat: vi.fn(() => false),
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
      updateMetadata: false,
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
    encodeImageToBlurhash: vi.fn(),
  }));
  vi.doMock('../../backend/media/ensureDecodedImage.js', () => ({
    ensureDecodedImage: vi.fn(),
  }));
  vi.doMock('../../backend/media/generateImageThumbnail.js', () => ({
    generateAllThumbs: vi.fn(),
  }));
  vi.doMock('../../backend/media/getImageMetadata.js', () => ({
    getImageMetadata: vi.fn(),
  }));
  vi.doMock('../../backend/media/getImageRatio.js', () => ({
    getImageRatio: vi.fn(),
  }));
  vi.doMock('../../backend/media/getVideoMetadata.js', () => ({
    getVideoMetadata: vi.fn(),
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
    addFile,
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
