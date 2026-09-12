import { afterAll, beforeAll, expect, test } from 'vitest';
import {
  CommentPermissions,
  FileFlag,
  MediaAspectFilter,
  MediaCommentsFilter,
  MediaMatchSource,
  MediaResultSortDirection,
  MediaResultSortType,
  MediaTypeFilter,
  RatingComparison,
  type MediaResultsFilterInput,
  type MediaResultsInput,
} from '../../shared/gql/graphql';
import { inArray } from '../../backend/node_modules/drizzle-orm/index.js';
import { db, initDb } from '../../backend/db/picrDb.js';
import { dbFile, dbFolder, dbUser } from '../../backend/db/models/index.js';
import { fileSearchFields } from '../../backend/helpers/fileDerivedFields.js';
import { defaultCredentials } from '../../backend/auth/defaultCredentials.js';
import { editUserMutation } from '../../shared/urql/mutations/editUserMutation.js';
import {
  mediaFolderFacetsQuery,
  mediaMatchSummaryQuery,
  mediaResultsNextPageQuery,
  mediaResultsQuery,
} from '../../shared/urql/queries/mediaResultsQuery.js';
import {
  createTestGraphqlClient,
  getLinkHeader,
  getUserHeader,
} from './testGraphqlClient.js';
import { testDatabaseUrl } from './testVariables.js';

const suffix = Math.random().toString(36).slice(2, 8);
const scopeName = `Résults_Scope%_${suffix}`;
const scopePath = scopeName;
const siblingPath = `RésultsXScopeZ_${suffix}`;
const now = new Date('2025-01-01T00:00:00.000Z');
const defaultSort = {
  type: MediaResultSortType.Filename,
  direction: MediaResultSortDirection.Asc,
};

let scopeId: number;
let socialId: number;
let verticalId: number;
let emptyId: number;
let siblingId: number;
let insertedFileIds: number[] = [];
const fileIdsByName = new Map<string, number>();
let linkUserId: number | undefined;
let adminClient: Awaited<ReturnType<typeof createTestGraphqlClient>>;

const insertFolder = async (
  name: string,
  relativePath: string,
  parentId: number,
) => {
  const [folder] = await db
    .insert(dbFolder)
    .values({
      name,
      relativePath,
      parentId,
      exists: true,
      existsRescan: true,
      folderLastModified: now,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  expect(folder).toBeDefined();
  return folder!;
};

const insertFile = async ({
  name,
  relativePath,
  folderId,
  type,
  imageRatio,
  rating,
  flag = null,
  totalComments,
  capturedAt = null,
  modifiedOffset,
  staleSearchFields = false,
}: {
  name: string;
  relativePath: string;
  folderId: number;
  type: 'File' | 'Image' | 'Video';
  imageRatio: number | null;
  rating: number;
  flag?: 'approved' | 'rejected' | 'none' | null;
  totalComments: number;
  capturedAt?: Date | null;
  modifiedOffset: number;
  staleSearchFields?: boolean;
}) => {
  const modified = new Date(now.getTime() + modifiedOffset);
  const searchFields = staleSearchFields
    ? {
        normalizedName: null,
        normalizedNameSource: null,
        normalizedRelativePath: null,
        normalizedRelativePathSource: null,
      }
    : fileSearchFields({ name, relativePath });
  const [file] = await db
    .insert(dbFile)
    .values({
      name,
      relativePath,
      folderId,
      type,
      imageRatio,
      rating,
      flag,
      totalComments,
      capturedAt,
      fileHash: `media-results-${suffix}-${name}`,
      fileSize: 1,
      fileCreated: modified,
      fileLastModified: modified,
      latestComment: totalComments ? modified : null,
      exists: true,
      existsRescan: true,
      createdAt: now,
      updatedAt: now,
      ...searchFields,
    })
    .returning({ id: dbFile.id });
  expect(file).toBeDefined();
  insertedFileIds.push(file!.id);
  fileIdsByName.set(name, file!.id);
};

beforeAll(async () => {
  process.env['DATABASE_URL'] = testDatabaseUrl;
  initDb();
  adminClient = await createTestGraphqlClient(
    await getUserHeader(defaultCredentials),
  );

  const scope = await insertFolder(scopeName, scopePath, 1);
  scopeId = scope.id;
  const social = await insertFolder(
    'Social Campaign',
    `${scopePath}/Social Campaign`,
    scopeId,
  );
  socialId = social.id;
  const vertical = await insertFolder(
    'Vertical',
    `${scopePath}/Social Campaign/Vertical`,
    socialId,
  );
  verticalId = vertical.id;
  const empty = await insertFolder('Empty', `${scopePath}/Empty`, scopeId);
  emptyId = empty.id;
  const sibling = await insertFolder(siblingPath, siblingPath, 1);
  siblingId = sibling.id;

  await insertFile({
    name: 'Café Hero.jpg',
    relativePath: scopePath,
    folderId: scopeId,
    type: 'Image',
    imageRatio: 1,
    rating: 5,
    flag: 'approved',
    totalComments: 2,
    capturedAt: new Date('2024-12-01T00:00:00.000Z'),
    modifiedOffset: 1_000,
  });
  await insertFile({
    name: 'Landscape.jpg',
    relativePath: scopePath,
    folderId: scopeId,
    type: 'Image',
    imageRatio: 1.3,
    rating: 1,
    totalComments: 0,
    modifiedOffset: 2_000,
  });
  await insertFile({
    name: 'Invalid ratio.jpg',
    relativePath: scopePath,
    folderId: scopeId,
    type: 'Image',
    imageRatio: 0,
    rating: 0,
    totalComments: 0,
    modifiedOffset: 2_500,
  });
  await insertFile({
    name: 'launch.mp4',
    relativePath: `${scopePath}/Social Campaign`,
    folderId: socialId,
    type: 'Video',
    imageRatio: 16 / 9,
    rating: 4,
    totalComments: 0,
    modifiedOffset: 3_000,
  });
  await insertFile({
    name: 'Poster Crème.jpg',
    relativePath: `${scopePath}/Social Campaign/Vertical`,
    folderId: verticalId,
    type: 'Image',
    imageRatio: 0.7,
    rating: 5,
    flag: 'rejected',
    totalComments: 1,
    capturedAt: new Date('2024-12-04T00:00:00.000Z'),
    modifiedOffset: 4_000,
    staleSearchFields: true,
  });
  await insertFile({
    name: 'leak-social.mp4',
    relativePath: siblingPath,
    folderId: siblingId,
    type: 'Video',
    imageRatio: 1,
    rating: 5,
    flag: 'approved',
    totalComments: 1,
    modifiedOffset: 5_000,
  });
});

afterAll(async () => {
  if (linkUserId) {
    await db.delete(dbUser).where(inArray(dbUser.id, [linkUserId]));
  }
  const folderIds = [verticalId, emptyId, socialId, scopeId, siblingId].filter(
    Number.isInteger,
  );
  if (folderIds.length) {
    await db
      .update(dbFolder)
      .set({ heroImageId: null, bannerImageId: null })
      .where(inArray(dbFolder.id, folderIds));
  }
  if (insertedFileIds.length) {
    await db.delete(dbFile).where(inArray(dbFile.id, insertedFileIds));
  }
  if (folderIds.length) {
    await db.delete(dbFolder).where(inArray(dbFolder.id, folderIds));
  }
});

const results = async (
  overrides: Partial<MediaResultsInput> = {},
  client = adminClient,
) => {
  const response = await client
    .query(mediaResultsQuery, {
      input: {
        folderId: String(scopeId),
        sort: defaultSort,
        ...overrides,
      },
    })
    .toPromise();
  expect(response.error).toBeUndefined();
  expect(response.data?.mediaResults).toBeDefined();
  return response.data!.mediaResults;
};

const nextPageResults = async (input: MediaResultsInput) => {
  const response = await adminClient
    .query(mediaResultsNextPageQuery, { input })
    .toPromise();
  expect(response.error).toBeUndefined();
  expect(response.data?.mediaResults).toBeDefined();
  return response.data!.mediaResults;
};

const summary = async (filters?: MediaResultsFilterInput) => {
  const response = await adminClient
    .query(mediaMatchSummaryQuery, {
      input: { folderId: String(scopeId), filters },
    })
    .toPromise();
  expect(response.error).toBeUndefined();
  return response.data!.mediaMatchSummary;
};

test('returns exact direct/tree totals and cumulative folder facets', async () => {
  const connection = await results();
  expect(connection.totalCount).toBe(5);
  expect(connection.folderCount).toBe(3);
  expect(connection.edges.map(({ file }) => file.name)).toEqual([
    'Café Hero.jpg',
    'Invalid ratio.jpg',
    'Landscape.jpg',
    'launch.mp4',
    'Poster Crème.jpg',
  ]);
  expect(
    connection.folderFacets.facets.map(({ folder, count, relativePath }) => ({
      name: folder.name,
      count,
      relativePath,
    })),
  ).toEqual([
    { name: 'Social Campaign', count: 2, relativePath: 'Social Campaign' },
  ]);
  expect(await summary()).toMatchObject({ directCount: 3, treeCount: 5 });
});

test('matches filename and descendant folder paths without matching the scope name', async () => {
  const pathMatch = await results({ query: 'social' });
  expect(pathMatch.edges.map(({ file }) => file.name)).toEqual([
    'launch.mp4',
    'Poster Crème.jpg',
  ]);
  expect(
    pathMatch.edges.every(
      ({ matchSource }) => matchSource === MediaMatchSource.FolderPath,
    ),
  ).toBe(true);

  const combinedMatch = await results({ query: 'social launch' });
  expect(combinedMatch.edges.map(({ file }) => file.name)).toEqual([
    'launch.mp4',
  ]);
  expect((await results({ query: 'résults' })).totalCount).toBe(0);
  expect((await results({ query: '%' })).totalCount).toBe(0);
  expect((await results({ query: '_' })).totalCount).toBe(0);
});

test('keeps accent search complete while derived fields are stale', async () => {
  expect((await results({ query: 'cafe' })).edges[0]?.file.name).toBe(
    'Café Hero.jpg',
  );
  expect((await results({ query: 'crème' })).edges[0]?.file.name).toBe(
    'Poster Crème.jpg',
  );
});

test('applies supported column filters with exclusive orientations', async () => {
  expect(
    (
      await summary({
        mediaType: MediaTypeFilter.Video,
      })
    ).treeCount,
  ).toBe(1);
  expect((await summary({ aspect: MediaAspectFilter.Square })).treeCount).toBe(
    1,
  );
  expect(
    (await summary({ aspect: MediaAspectFilter.Landscape })).treeCount,
  ).toBe(2);
  expect(
    (await summary({ aspect: MediaAspectFilter.Portrait })).treeCount,
  ).toBe(1);
  expect(
    (
      await summary({
        rating: { comparison: RatingComparison.AtLeast, value: 5 },
      })
    ).treeCount,
  ).toBe(2);
  expect((await summary({ flag: FileFlag.None })).treeCount).toBe(3);
  expect(
    (await summary({ comments: MediaCommentsFilter.Some })).treeCount,
  ).toBe(2);
});

test('folder refinement is cumulative, self-excluding and retains zero-count selections', async () => {
  const social = await results({
    filters: { folderIds: [String(socialId)] },
  });
  expect(social.totalCount).toBe(2);
  expect(
    social.folderFacets.facets.find(
      ({ folder }) => folder.id === String(socialId),
    )?.count,
  ).toBe(2);

  const empty = await results({
    filters: { folderIds: [String(emptyId)] },
  });
  expect(empty.totalCount).toBe(0);
  expect(
    empty.folderFacets.facets.find(
      ({ folder }) => folder.id === String(emptyId),
    ),
  ).toMatchObject({ count: 0, relativePath: 'Empty' });

  const selectedWithoutMatches = await results({
    query: 'definitely-no-match',
    filters: { folderIds: [String(verticalId)] },
  });
  expect(
    selectedWithoutMatches.folderFacets.facets.map(({ folder }) => folder.name),
  ).toEqual(['Social Campaign']);
  expect(
    selectedWithoutMatches.selectedFolders.map(({ name }) => name),
  ).toEqual(['Vertical']);

  const drilled = await adminClient
    .query(mediaFolderFacetsQuery, {
      input: {
        folderId: String(scopeId),
        query: 'definitely-no-match',
        filters: { folderIds: [String(verticalId)] },
        sort: defaultSort,
      },
      parentFolderId: String(socialId),
      first: 1,
    })
    .toPromise();
  expect(drilled.error).toBeUndefined();
  expect(
    drilled.data?.mediaResults.folderFacets.facets.map(({ folder, count }) => ({
      name: folder.name,
      count,
    })),
  ).toEqual([{ name: 'Vertical', count: 0 }]);
  expect(drilled.data?.mediaResults.folderFacets.pageInfo.hasNextPage).toBe(
    false,
  );
});

test('folder facet pages are bounded and cursors are parent-bound', async () => {
  const input: MediaResultsInput = {
    folderId: String(scopeId),
    filters: { folderIds: [String(emptyId)] },
    sort: defaultSort,
  };
  const first = await adminClient
    .query(mediaFolderFacetsQuery, { input, first: 1 })
    .toPromise();
  expect(first.error).toBeUndefined();
  expect(
    first.data?.mediaResults.folderFacets.facets.map(
      ({ folder }) => folder.name,
    ),
  ).toEqual(['Empty']);
  expect(first.data?.mediaResults.folderFacets.pageInfo.hasNextPage).toBe(true);

  const second = await adminClient
    .query(mediaFolderFacetsQuery, {
      input,
      first: 1,
      after: first.data?.mediaResults.folderFacets.pageInfo.endCursor,
    })
    .toPromise();
  expect(second.error).toBeUndefined();
  expect(
    second.data?.mediaResults.folderFacets.facets.map(
      ({ folder }) => folder.name,
    ),
  ).toEqual(['Social Campaign']);
  expect(second.data?.mediaResults.folderFacets.pageInfo.hasNextPage).toBe(
    false,
  );

  const wrongParent = await adminClient
    .query(mediaFolderFacetsQuery, {
      input,
      parentFolderId: String(socialId),
      first: 1,
      after: first.data?.mediaResults.folderFacets.pageInfo.endCursor,
    })
    .toPromise();
  expect(wrongParent.error?.graphQLErrors[0]?.extensions['code']).toBe(
    'BAD_USER_INPUT',
  );
});

test('keyset cursors paginate deterministically and are criteria-bound', async () => {
  const first = await results({ first: 2 });
  expect(first.pageInfo.hasNextPage).toBe(true);
  expect(first.edges).toHaveLength(2);
  const second = await nextPageResults({
    folderId: String(scopeId),
    sort: defaultSort,
    first: 2,
    after: first.pageInfo.endCursor,
  });
  expect(second.edges.map(({ file }) => file.name)).toEqual([
    'Landscape.jpg',
    'launch.mp4',
  ]);
  expect(second.pageInfo.hasNextPage).toBe(true);
  const third = await nextPageResults({
    folderId: String(scopeId),
    sort: defaultSort,
    first: 2,
    after: second.pageInfo.endCursor,
  });
  expect(third.edges.map(({ file }) => file.name)).toEqual([
    'Poster Crème.jpg',
  ]);
  expect(third.pageInfo.hasNextPage).toBe(false);

  const wrongCriteria = await adminClient
    .query(mediaResultsQuery, {
      input: {
        folderId: String(scopeId),
        query: 'social',
        sort: defaultSort,
        after: first.pageInfo.endCursor,
      },
    })
    .toPromise();
  expect(wrongCriteria.error?.graphQLErrors[0]?.extensions['code']).toBe(
    'BAD_USER_INPUT',
  );
});

test('selection identity is independent of sort while cursors remain sort-bound', async () => {
  const summaryValue = await summary({
    mediaType: MediaTypeFilter.Image,
  });
  const filename = await results({
    filters: { mediaType: MediaTypeFilter.Image },
    first: 1,
  });
  const rating = await results({
    filters: { mediaType: MediaTypeFilter.Image },
    sort: {
      type: MediaResultSortType.Rating,
      direction: MediaResultSortDirection.Desc,
    },
    first: 1,
  });
  expect(filename.selectionFingerprint).toBe(summaryValue.selectionFingerprint);
  expect(rating.selectionFingerprint).toBe(summaryValue.selectionFingerprint);

  const wrongSort = await adminClient
    .query(mediaResultsNextPageQuery, {
      input: {
        folderId: String(scopeId),
        filters: { mediaType: MediaTypeFilter.Image },
        sort: {
          type: MediaResultSortType.LastModified,
          direction: MediaResultSortDirection.Desc,
        },
        after: filename.pageInfo.endCursor,
      },
    })
    .toPromise();
  expect(wrongSort.error?.graphQLErrors[0]?.extensions['code']).toBe(
    'BAD_USER_INPUT',
  );
});

test('all gallery sorts retain deterministic keyset pagination', async () => {
  const cases: Array<{
    sort: MediaResultsInput['sort'];
    expected: string[];
  }> = [
    {
      sort: {
        type: MediaResultSortType.LastModified,
        direction: MediaResultSortDirection.Desc,
      },
      expected: [
        'Poster Crème.jpg',
        'launch.mp4',
        'Invalid ratio.jpg',
        'Landscape.jpg',
        'Café Hero.jpg',
      ],
    },
    {
      sort: {
        type: MediaResultSortType.DateTaken,
        direction: MediaResultSortDirection.Asc,
      },
      expected: [
        'Café Hero.jpg',
        'Poster Crème.jpg',
        'Landscape.jpg',
        'Invalid ratio.jpg',
        'launch.mp4',
      ],
    },
    {
      sort: {
        type: MediaResultSortType.RecentlyCommented,
        direction: MediaResultSortDirection.Desc,
      },
      expected: [
        'Poster Crème.jpg',
        'Café Hero.jpg',
        'Invalid ratio.jpg',
        'Landscape.jpg',
        'launch.mp4',
      ],
    },
    {
      sort: {
        type: MediaResultSortType.Rating,
        direction: MediaResultSortDirection.Desc,
      },
      expected: [
        'Café Hero.jpg',
        'Poster Crème.jpg',
        'launch.mp4',
        'Landscape.jpg',
        'Invalid ratio.jpg',
      ],
    },
  ];

  for (const { sort, expected } of cases) {
    const names: string[] = [];
    let after: string | null | undefined;
    do {
      const page = await results({ sort, first: 1, after });
      names.push(...page.edges.map(({ file }) => file.name));
      after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
    } while (after);
    expect(names).toEqual(expected);
  }
});

test('a cursor remains stable when an unrelated review value changes', async () => {
  const first = await results({ sort: defaultSort, first: 1 });
  expect(first.edges[0]?.file.name).toBe('Café Hero.jpg');
  const cafeId = fileIdsByName.get('Café Hero.jpg');
  expect(cafeId).toBeDefined();
  if (!cafeId) return;
  await db
    .update(dbFile)
    .set({ rating: 0 })
    .where(inArray(dbFile.id, [cafeId]));
  try {
    const next = await results({
      sort: defaultSort,
      first: 4,
      after: first.pageInfo.endCursor,
    });
    expect(next.edges.map(({ file }) => file.name)).toEqual([
      'Invalid ratio.jpg',
      'Landscape.jpg',
      'launch.mp4',
      'Poster Crème.jpg',
    ]);
  } finally {
    await db
      .update(dbFile)
      .set({ rating: 5 })
      .where(inArray(dbFile.id, [cafeId]));
  }
});

test('public links stay scoped and review filters are ignored without permission', async () => {
  const uuid = `media-results-${suffix}`;
  const created = await adminClient
    .mutation(editUserMutation, {
      folderId: String(scopeId),
      name: 'Media results link',
      username: `${uuid}@example.com`,
      uuid,
      enabled: true,
      commentPermissions: CommentPermissions.None,
    })
    .toPromise();
  expect(created.error).toBeUndefined();
  linkUserId = Number(created.data?.editUser.id);
  const linkClient = await createTestGraphqlClient(await getLinkHeader(uuid));

  const sanitized = await results(
    { filters: { flag: FileFlag.Approved } },
    linkClient,
  );
  expect(sanitized.totalCount).toBe(5);

  const outsideRoot = await linkClient
    .query(mediaResultsQuery, {
      input: {
        folderId: String(siblingId),
        sort: defaultSort,
      },
    })
    .toPromise();
  expect(outsideRoot.error).toBeDefined();

  const outsideFacet = await linkClient
    .query(mediaResultsQuery, {
      input: {
        folderId: String(scopeId),
        filters: { folderIds: [String(siblingId)] },
        sort: defaultSort,
      },
    })
    .toPromise();
  expect(outsideFacet.error?.graphQLErrors[0]?.extensions['code']).toBe(
    'BAD_USER_INPUT',
  );

  const outsideFacetParent = await linkClient
    .query(mediaFolderFacetsQuery, {
      input: { folderId: String(scopeId), sort: defaultSort },
      parentFolderId: String(siblingId),
    })
    .toPromise();
  expect(outsideFacetParent.error?.graphQLErrors[0]?.extensions['code']).toBe(
    'BAD_USER_INPUT',
  );
});

test('rejects malformed pagination input', async () => {
  const invalidPageSize = await adminClient
    .query(mediaResultsQuery, {
      input: {
        folderId: String(scopeId),
        sort: defaultSort,
        first: 0,
      },
    })
    .toPromise();
  expect(invalidPageSize.error?.graphQLErrors[0]?.extensions['code']).toBe(
    'BAD_USER_INPUT',
  );

  const invalidCursor = await adminClient
    .query(mediaResultsQuery, {
      input: {
        folderId: String(scopeId),
        sort: defaultSort,
        after: 'not-a-media-results-cursor',
      },
    })
    .toPromise();
  expect(invalidCursor.error?.graphQLErrors[0]?.extensions['code']).toBe(
    'BAD_USER_INPUT',
  );
});
