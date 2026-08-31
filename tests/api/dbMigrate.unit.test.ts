import { afterEach, expect, test, vi } from 'vitest';
import type { FileFields } from '../../backend/db/picrDb.js';
import type { IPicrConfiguration } from '../../backend/config/IPicrConfiguration.js';

const fileRow = (props: Pick<FileFields, 'exists' | 'id'>) =>
  ({
    blurHash: null,
    createdAt: new Date('2026-08-10T00:00:00.000Z'),
    duration: null,
    existsRescan: true,
    fileCreated: new Date('2026-08-10T00:00:00.000Z'),
    fileHash: 'hash',
    fileLastModified: new Date('2026-08-10T00:00:00.000Z'),
    fileSize: 100,
    flag: null,
    folderId: 10,
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
    ...props,
  }) satisfies FileFields;

const loadDbMigrate = async ({
  lastBootedVersion = '1.3.2',
}: {
  lastBootedVersion?: string;
} = {}) => {
  vi.resetModules();

  const keeper = fileRow({ exists: true, id: 1 });
  const duplicateLive = fileRow({ exists: true, id: 2 });
  const archivedTwin = fileRow({ exists: false, id: 3 });
  const duplicateGroups = [
    {
      count: 2,
      folderId: 10,
      name: 'image.jpg',
      relativePath: 'folder',
    },
  ];

  const columns = {
    dbAccessLog: { folderId: 'AccessLogs.folderId' },
    dbBranding: {
      folderId: 'Brandings.folderId',
      id: 'Brandings.id',
    },
    dbComment: { fileId: 'Comments.fileId', folderId: 'Comments.folderId' },
    dbFile: {
      exists: 'Files.exists',
      folderId: 'Files.folderId',
      id: 'Files.id',
      name: 'Files.name',
      relativePath: 'Files.relativePath',
      type: 'Files.type',
    },
    dbFolder: {
      id: 'Folders.id',
      parentId: 'Folders.parentId',
      relativePath: 'Folders.relativePath',
    },
    dbUser: { folderId: 'Users.folderId' },
  };
  const selectBuilder = {
    from: vi.fn(() => selectBuilder),
    groupBy: vi.fn(() => selectBuilder),
    having: vi.fn(async () => duplicateGroups),
    where: vi.fn(() => selectBuilder),
  };
  const mergeDuplicateFileRows = vi.fn();
  const setServerOptions = vi.fn();

  vi.doMock('drizzle-orm', async (importOriginal) => {
    const actual = await importOriginal<typeof import('drizzle-orm')>();
    return {
      ...actual,
      and: vi.fn((...conditions: unknown[]) => ({ and: conditions })),
      count: vi.fn(() => 'count(*)'),
      eq: vi.fn((column: string, value: unknown) => ({ eq: [column, value] })),
      sql: vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({
        sql: [strings, values],
      })),
    };
  });
  vi.doMock('../../backend/db/models/index.js', () => columns);
  vi.doMock('../../backend/db/picrDb.js', () => ({
    db: {
      query: {
        dbFile: {
          findMany: vi.fn(async () => [keeper, duplicateLive, archivedTwin]),
        },
      },
      select: vi.fn(() => selectBuilder),
    },
    getServerOptions: vi.fn(async () => ({
      lastBootedVersion,
      tokenSecret: 'token',
    })),
    setServerOptions,
  }));
  vi.doMock('../../backend/logger.js', () => ({ log: vi.fn() }));
  vi.doMock('../../backend/boot/dbVersionGuard.js', () => ({
    assertDatabaseVersionCompatible: vi.fn(),
  }));
  vi.doMock('../../backend/boot/migrateThumbnailHashes.js', () => ({
    runThumbnailHashMigrationIfNeeded: vi.fn(),
  }));
  vi.doMock('../../backend/boot/backfillImageDimensions.js', () => ({
    backfillImageDimensions: vi.fn(),
  }));
  vi.doMock('../../backend/filesystem/fileIdentity.js', () => ({
    compareFilesForIdentity: vi.fn((a: FileFields, b: FileFields) => {
      if (a.exists !== b.exists) return Number(b.exists) - Number(a.exists);
      return a.id - b.id;
    }),
    mergeDuplicateFileRows,
  }));

  const { dbMigrate } = await import('../../backend/boot/dbMigrate.js');
  return {
    archivedTwin,
    dbMigrate,
    duplicateLive,
    keeper,
    mergeDuplicateFileRows,
    setServerOptions,
  };
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

test('runs live duplicate cleanup on upgrade without deleting archived twins', async () => {
  const {
    archivedTwin,
    dbMigrate,
    duplicateLive,
    keeper,
    mergeDuplicateFileRows,
    setServerOptions,
  } = await loadDbMigrate();
  const config = {
    updateMetadata: false,
    version: '1.3.6',
  } as IPicrConfiguration;

  await dbMigrate(config);

  expect(mergeDuplicateFileRows).toHaveBeenCalledWith(keeper, [duplicateLive]);
  expect(mergeDuplicateFileRows).not.toHaveBeenCalledWith(
    expect.anything(),
    expect.arrayContaining([archivedTwin]),
  );
  expect(setServerOptions).toHaveBeenCalledWith({ lastBootedVersion: '1.3.6' });
});

test('runs live duplicate cleanup for the latest released buggy version', async () => {
  const { dbMigrate, duplicateLive, keeper, mergeDuplicateFileRows } =
    await loadDbMigrate({ lastBootedVersion: '1.3.5' });
  const config = {
    updateMetadata: false,
    version: '1.3.6',
  } as IPicrConfiguration;

  await dbMigrate(config);

  expect(mergeDuplicateFileRows).toHaveBeenCalledWith(keeper, [duplicateLive]);
});
