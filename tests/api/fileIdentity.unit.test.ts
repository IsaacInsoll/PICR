import { afterEach, expect, test, vi } from 'vitest';
import type { FileFields } from '../../backend/db/picrDb.js';

interface MockCommentRow {
  id: number;
  fileId: number;
  folderId: number;
  createdAt: Date;
  systemGenerated: boolean | null;
}

interface MockFolderRow {
  id: number;
  heroImageId: number | null;
  bannerImageId: number | null;
}

const fileRow = (props: Partial<FileFields> & Pick<FileFields, 'id'>) =>
  ({
    blurHash: null,
    createdAt: new Date('2026-08-10T00:00:00.000Z'),
    duration: null,
    exists: true,
    existsRescan: true,
    fileCreated: new Date('2026-08-10T00:00:00.000Z'),
    fileHash: 'hash',
    fileLastModified: new Date('2026-08-10T00:00:00.000Z'),
    fileSize: 100,
    flag: null,
    folderId: 10,
    id: props.id,
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

const loadFileIdentity = async ({
  comments = [],
  files = [],
  folders = [],
}: {
  comments?: MockCommentRow[];
  files?: FileFields[];
  folders?: MockFolderRow[];
}) => {
  vi.resetModules();

  const columns = {
    dbComment: {
      createdAt: 'Comments.createdAt',
      fileId: 'Comments.fileId',
      folderId: 'Comments.folderId',
      systemGenerated: 'Comments.systemGenerated',
    },
    dbFile: {
      folderId: 'Files.folderId',
      id: 'Files.id',
      name: 'Files.name',
      relativePath: 'Files.relativePath',
    },
    dbFolder: {
      bannerImageId: 'Folders.bannerImageId',
      heroImageId: 'Folders.heroImageId',
    },
  };

  const keeperUpdate = vi.fn();

  vi.doMock('drizzle-orm', () => ({
    and: vi.fn((...conditions: unknown[]) => ({ and: conditions })),
    eq: vi.fn((column: string, value: unknown) => ({ eq: [column, value] })),
    inArray: vi.fn((column: string, values: number[]) => ({
      inArray: [column, values],
    })),
    sql: vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({
      sql: [strings, values],
    })),
  }));
  vi.doMock('../../backend/db/models/index.js', () => columns);
  vi.doMock('../../backend/db/picrDb.js', () => ({
    db: {
      query: {
        dbFile: {
          findMany: vi.fn(async () => files),
        },
      },
      transaction: vi.fn(async (callback: (tx: unknown) => Promise<void>) => {
        const tx = {
          delete: vi.fn(() => ({
            where: vi.fn(async () => {
              files.splice(
                0,
                files.length,
                ...files.filter((file) => file.id === 1),
              );
            }),
          })),
          select: vi.fn(() => ({
            from: vi.fn(() => ({
              where: vi.fn(async () => {
                const keeperComments = comments.filter(
                  (comment) => comment.fileId === 1,
                );
                return [
                  {
                    latestComment:
                      keeperComments
                        .map((comment) => comment.createdAt)
                        .toSorted((a, b) => b.getTime() - a.getTime())[0] ??
                      null,
                    totalComments: keeperComments.filter(
                      (comment) => comment.systemGenerated !== true,
                    ).length,
                  },
                ];
              }),
            })),
          })),
          update: vi.fn((table: unknown) => ({
            set: vi.fn((values: Record<string, unknown>) => ({
              where: vi.fn(async () => {
                if (table === columns.dbComment) {
                  comments.forEach((comment) => {
                    if (comment.fileId === 2) {
                      comment.fileId = values['fileId'] as number;
                      comment.folderId = values['folderId'] as number;
                    }
                  });
                }
                if (table === columns.dbFolder) {
                  folders.forEach((folder) => {
                    if (folder.heroImageId === 2 && 'heroImageId' in values) {
                      folder.heroImageId = values['heroImageId'] as number;
                    }
                    if (
                      folder.bannerImageId === 2 &&
                      'bannerImageId' in values
                    ) {
                      folder.bannerImageId = values['bannerImageId'] as number;
                    }
                  });
                }
                if (table === columns.dbFile) keeperUpdate(values);
              }),
            })),
          })),
        };
        await callback(tx);
      }),
    },
  }));

  const module = await import('../../backend/filesystem/fileIdentity.js');
  return { ...module, keeperUpdate };
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

test('orders file identity matches by live imported row before archived or empty rows', async () => {
  const liveImported = fileRow({ id: 3, exists: true, fileHash: 'hash' });
  const archivedImported = fileRow({ id: 1, exists: false, fileHash: 'hash' });
  const liveEmpty = fileRow({
    id: 2,
    exists: true,
    fileHash: '',
    metadata: null,
  });
  const { compareFilesForIdentity } = await loadFileIdentity({});

  expect(
    [archivedImported, liveEmpty, liveImported].toSorted(
      compareFilesForIdentity,
    ),
  ).toEqual([liveImported, liveEmpty, archivedImported]);
});

test('merges duplicate rows transactionally and persists comment summary, flag, and rating', async () => {
  const keeper = fileRow({ id: 1, flag: null, rating: 1, totalComments: 0 });
  const duplicate = fileRow({
    id: 2,
    flag: 'approved',
    rating: 5,
    totalComments: 0,
  });
  const comments: MockCommentRow[] = [
    {
      createdAt: new Date('2026-08-10T01:00:00.000Z'),
      fileId: 2,
      folderId: 10,
      id: 1,
      systemGenerated: null,
    },
    {
      createdAt: new Date('2026-08-10T02:00:00.000Z'),
      fileId: 2,
      folderId: 10,
      id: 2,
      systemGenerated: false,
    },
    {
      createdAt: new Date('2026-08-10T03:00:00.000Z'),
      fileId: 2,
      folderId: 10,
      id: 3,
      systemGenerated: true,
    },
  ];
  const folders = [{ bannerImageId: 2, heroImageId: 2, id: 1 }];
  const files = [keeper, duplicate];
  const { keeperUpdate, mergeDuplicateFileRows } = await loadFileIdentity({
    comments,
    files,
    folders,
  });

  await mergeDuplicateFileRows(keeper, [duplicate]);

  expect(files).toEqual([keeper]);
  expect(comments).toEqual([
    {
      createdAt: new Date('2026-08-10T01:00:00.000Z'),
      fileId: 1,
      folderId: 10,
      id: 1,
      systemGenerated: null,
    },
    {
      createdAt: new Date('2026-08-10T02:00:00.000Z'),
      fileId: 1,
      folderId: 10,
      id: 2,
      systemGenerated: false,
    },
    {
      createdAt: new Date('2026-08-10T03:00:00.000Z'),
      fileId: 1,
      folderId: 10,
      id: 3,
      systemGenerated: true,
    },
  ]);
  expect(folders).toEqual([{ bannerImageId: 1, heroImageId: 1, id: 1 }]);
  expect(keeper).toMatchObject({
    flag: 'approved',
    rating: 5,
    totalComments: 2,
  });
  expect(keeper.latestComment).toEqual(new Date('2026-08-10T03:00:00.000Z'));
  expect(keeperUpdate).toHaveBeenCalledWith(
    expect.objectContaining({
      flag: 'approved',
      latestComment: new Date('2026-08-10T03:00:00.000Z'),
      rating: 5,
      totalComments: 2,
    }),
  );
});
