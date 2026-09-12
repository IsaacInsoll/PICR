import { createHash } from 'node:crypto';
import { GraphQLError } from 'graphql';
import {
  and,
  asc,
  count,
  countDistinct,
  eq,
  gt,
  gte,
  inArray,
  isNull,
  like,
  lt,
  lte,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import type {
  AspectFilter,
  CommentPresence,
  FileFlagFilter,
  MediaFilterCriteria,
  MediaTypeFilterValue,
  RatingComparison,
} from '@shared/files/mediaCriteria.js';
import {
  defaultMediaFilterCriteria,
  mediaCriteriaFingerprint,
  normalizeMediaFilterCriteria,
  normalizeSearchText,
} from '@shared/files/mediaCriteria.js';
import { contextPermissions } from '../auth/contextPermissions.js';
import { db, type FileFields, type FolderFields } from '../db/picrDb.js';
import { dbFile, dbFolder } from '../db/models/index.js';
import {
  descendantPathPattern,
  escapeLikePattern,
} from '../helpers/descendantPathPattern.js';
import { folderIsUnderFolder } from '../helpers/folderIsUnderFolderId.js';
import { fileToJSON } from '../graphql/helpers/fileToJSON.js';
import { parseNumericId } from '../graphql/helpers/parseNumericId.js';
import type { PicrRequestContext } from '../types/PicrRequestContext.js';

export const DEFAULT_MEDIA_RESULTS_PAGE_SIZE = 100;
export const MAX_MEDIA_RESULTS_PAGE_SIZE = 200;
export const DEFAULT_MEDIA_FOLDER_FACETS_PAGE_SIZE = 100;
export const MAX_MEDIA_FOLDER_FACETS_PAGE_SIZE = 200;
const MAX_MEDIA_RESULTS_QUERY_LENGTH = 500;
const MAX_MEDIA_RESULTS_QUERY_TOKENS = 20;
const MAX_MEDIA_RESULTS_FOLDER_FILTERS = 100;

export interface MediaResultsRatingInput {
  comparison?: RatingComparison | null;
  value?: number | null;
}

export interface MediaResultsFilterInput {
  mediaType?: MediaTypeFilterValue | null;
  aspect?: AspectFilter | null;
  flag?: FileFlagFilter | null;
  rating?: MediaResultsRatingInput | null;
  comments?: CommentPresence | null;
  folderIds?: readonly (number | string)[] | null;
}

export interface MediaResultsSortInput {
  type:
    'Filename' | 'LastModified' | 'DateTaken' | 'RecentlyCommented' | 'Rating';
  direction: 'Asc' | 'Desc';
}

type MediaResultsSortType = MediaResultsSortInput['type'];
type MediaResultsSortDirection = MediaResultsSortInput['direction'];

export interface MediaResultsSelectionInput {
  folderId: number | string;
  query?: string | null;
  filters?: MediaResultsFilterInput | null;
  sort?: MediaResultsSortInput | null;
}

interface SearchToken {
  normalized: string;
  rawLower: string;
}

interface CursorPayload {
  version: 1;
  fingerprint: string;
  primary: string | number | null;
  path: string;
  name: string;
  rawName: string;
  id: number;
}

interface FolderFacetCursorPayload {
  version: 1;
  fingerprint: string;
  parentFolderId: number;
  path: string;
  id: number;
}

interface SelectedFileRow {
  file: FileFields;
  folder: FolderFields;
  primary: string | number | Date | null;
  sortPath: string;
  sortName: string;
  sortRawName: string;
}

export interface MediaResultEdgeValue {
  cursor: string;
  file: ReturnType<typeof fileToJSON>;
  folder: FolderFields;
  relativePath: string;
  matchSource: 'Filename' | 'FolderPath' | null;
}

export interface MediaResultsPageValue {
  edges: MediaResultEdgeValue[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}

export interface MediaFolderFacetValue {
  folder: FolderFields;
  count: number;
  relativePath: string;
}

export interface MediaFolderFacetsPageValue {
  facets: MediaFolderFacetValue[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}

export interface MediaMatchSummaryValue {
  directCount: number;
  treeCount: number;
  selectionFingerprint: string;
}

const badInput = (message: string): never => {
  throw new GraphQLError(message, {
    extensions: { code: 'BAD_USER_INPUT' },
  });
};

const sqlAnd = (...predicates: readonly (SQL | undefined)[]): SQL =>
  sql`(${sql.join(
    predicates.filter((predicate): predicate is SQL => !!predicate),
    sql` AND `,
  )})`;

const sqlOr = (...predicates: readonly (SQL | undefined)[]): SQL =>
  sql`(${sql.join(
    predicates.filter((predicate): predicate is SQL => !!predicate),
    sql` OR `,
  )})`;

const canonicalQuery = (query: string | null | undefined): string => {
  const normalized = query?.trim().replace(/\s+/g, ' ') ?? '';
  if (normalized.length > MAX_MEDIA_RESULTS_QUERY_LENGTH) {
    badInput(
      `Search query must be ${MAX_MEDIA_RESULTS_QUERY_LENGTH} characters or fewer`,
    );
  }
  if (
    normalized &&
    normalized.split(' ').length > MAX_MEDIA_RESULTS_QUERY_TOKENS
  ) {
    badInput(
      `Search query must contain ${MAX_MEDIA_RESULTS_QUERY_TOKENS} terms or fewer`,
    );
  }
  return normalized;
};

const searchTokensFor = (query: string): SearchToken[] =>
  query
    ? query.split(' ').map((token) => ({
        normalized: normalizeSearchText(token),
        rawLower: token.toLowerCase(),
      }))
    : [];

const pathWithinFolder = (
  pathColumn: typeof dbFile.relativePath | typeof dbFolder.relativePath,
  folder: FolderFields,
): SQL => {
  const path = folder.relativePath ?? '';
  if (!path) return sql`true`;
  return sqlOr(
    eq(pathColumn, path),
    like(pathColumn, descendantPathPattern(path)),
  );
};

const relativeFolderPath = (
  path: string | null,
  scopePath: string | null,
): string => {
  const value = path ?? '';
  const root = scopePath ?? '';
  if (!root) return value;
  if (value === root) return '';
  return value.startsWith(`${root}/`) ? value.slice(root.length + 1) : value;
};

const currentNormalizedName = sql<string>`(CASE WHEN ${dbFile.normalizedNameSource} IS NOT DISTINCT FROM ${dbFile.name} AND ${dbFile.normalizedName} IS NOT NULL THEN ${dbFile.normalizedName} ELSE LOWER(${dbFile.name}) END) COLLATE "C"`;
const currentNormalizedPath = sql<string>`(CASE WHEN ${dbFile.normalizedRelativePathSource} IS NOT DISTINCT FROM ${dbFile.relativePath} AND ${dbFile.normalizedRelativePath} IS NOT NULL THEN ${dbFile.normalizedRelativePath} ELSE LOWER(${dbFile.relativePath}) END) COLLATE "C"`;
const currentRawName = sql<string>`${dbFile.name} COLLATE "C"`;

const tokenPredicate = (token: SearchToken, scopePath: string): SQL => {
  const normalizedNameCurrent = sql<boolean>`${dbFile.normalizedNameSource} IS NOT DISTINCT FROM ${dbFile.name} AND ${dbFile.normalizedName} IS NOT NULL`;
  const normalizedPathCurrent = sql<boolean>`${dbFile.normalizedRelativePathSource} IS NOT DISTINCT FROM ${dbFile.relativePath} AND ${dbFile.normalizedRelativePath} IS NOT NULL`;
  const normalizedPattern = `%${escapeLikePattern(token.normalized)}%`;
  const rawPattern = `%${escapeLikePattern(token.rawLower)}%`;
  const normalizedScopePath = normalizeSearchText(scopePath);
  const normalizedPathTail = scopePath
    ? sql<string>`SUBSTRING(${dbFile.normalizedRelativePath} FROM CHAR_LENGTH(${normalizedScopePath}) + 2)`
    : dbFile.normalizedRelativePath;
  const rawPathTail = scopePath
    ? sql<string>`SUBSTRING(LOWER(${dbFile.relativePath}) FROM CHAR_LENGTH(LOWER(${scopePath})) + 2)`
    : sql<string>`LOWER(${dbFile.relativePath})`;

  return sqlOr(
    and(normalizedNameCurrent, like(dbFile.normalizedName, normalizedPattern)),
    and(
      sql<boolean>`NOT (${normalizedNameCurrent})`,
      like(sql<string>`LOWER(${dbFile.name})`, rawPattern),
    ),
    and(normalizedPathCurrent, like(normalizedPathTail, normalizedPattern)),
    and(
      sql<boolean>`NOT (${normalizedPathCurrent})`,
      like(rawPathTail, rawPattern),
    ),
  );
};

const aspectPredicate = (aspect: AspectFilter): SQL | undefined => {
  const finitePositive = and(
    gt(dbFile.imageRatio, 0),
    sql<boolean>`${dbFile.imageRatio} < 'Infinity'::float8`,
  );
  if (aspect === 'landscape') {
    return and(finitePositive, gt(dbFile.imageRatio, 1.1));
  }
  if (aspect === 'portrait') {
    return and(finitePositive, lt(dbFile.imageRatio, 0.9));
  }
  if (aspect === 'square') {
    return and(
      finitePositive,
      gte(dbFile.imageRatio, 0.9),
      lte(dbFile.imageRatio, 1.1),
    );
  }
  return undefined;
};

const ratingPredicate = (
  comparison: RatingComparison | null,
  rating: number,
): SQL | undefined => {
  if (comparison === 'equal') return eq(dbFile.rating, rating);
  if (comparison === 'atLeast') return gte(dbFile.rating, rating);
  if (comparison === 'atMost') return lte(dbFile.rating, rating);
  return undefined;
};

const filterPredicates = (filters: MediaFilterCriteria): SQL[] => {
  const predicates: (SQL | undefined)[] = [
    filters.mediaType === 'All'
      ? undefined
      : eq(dbFile.type, filters.mediaType),
    aspectPredicate(filters.aspect),
    filters.flag === 'none'
      ? or(isNull(dbFile.flag), eq(dbFile.flag, 'none'))
      : filters.flag
        ? eq(dbFile.flag, filters.flag)
        : undefined,
    ratingPredicate(filters.ratingComparison, filters.rating),
    filters.comments === 'some'
      ? gt(dbFile.totalComments, 0)
      : filters.comments === 'none'
        ? eq(dbFile.totalComments, 0)
        : undefined,
  ];
  return predicates.filter((predicate): predicate is SQL => !!predicate);
};

const primarySortExpression = (type: MediaResultsSortType): SQL => {
  if (type === 'Filename') return currentNormalizedName;
  if (type === 'LastModified') return sql`${dbFile.fileLastModified}`;
  if (type === 'DateTaken') {
    return sql`COALESCE(${dbFile.capturedAt}, ${dbFile.fileLastModified})`;
  }
  if (type === 'RecentlyCommented') return sql`${dbFile.latestComment}`;
  return sql`${dbFile.rating}`;
};

const scalarCursorValue = (
  value: string | number | Date | null,
): string | number | null =>
  // Every current writer supplies JavaScript Dates (filesystem timestamps are
  // explicitly rounded first), so the database sort values have millisecond
  // precision. If a future writer stores SQL-microsecond timestamps, preserve
  // that precision in the cursor before using the new writer for these sorts.
  value instanceof Date ? value.toISOString() : value;

const encodeOpaqueCursor = (
  payload: CursorPayload | FolderFacetCursorPayload,
): string => Buffer.from(JSON.stringify(payload)).toString('base64url');

const decodeCursor = (
  encoded: string,
  fingerprint: string,
  sortType: MediaResultsSortType,
): CursorPayload => {
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    );
    if (typeof parsed !== 'object' || parsed === null) throw new Error();
    const value = parsed as Partial<CursorPayload>;
    const primaryIsValid =
      value.primary === null ||
      typeof value.primary === 'string' ||
      typeof value.primary === 'number';
    if (
      value.version !== 1 ||
      value.fingerprint !== fingerprint ||
      !primaryIsValid ||
      typeof value.path !== 'string' ||
      typeof value.name !== 'string' ||
      typeof value.rawName !== 'string' ||
      !Number.isInteger(value.id) ||
      Number(value.id) <= 0 ||
      (sortType === 'Rating' && typeof value.primary !== 'number') ||
      (sortType !== 'Rating' &&
        sortType !== 'RecentlyCommented' &&
        typeof value.primary !== 'string')
    ) {
      throw new Error();
    }
    return value as CursorPayload;
  } catch {
    return badInput('Invalid or expired media results cursor');
  }
};

const cursorPrimaryValue = (
  value: string | number | null,
  sortType: MediaResultsSortType,
): string | number | Date | null => {
  if (
    value !== null &&
    (sortType === 'LastModified' ||
      sortType === 'DateTaken' ||
      sortType === 'RecentlyCommented')
  ) {
    const date = new Date(String(value));
    if (!Number.isFinite(date.getTime()))
      badInput('Invalid media results cursor');
    return date;
  }
  return value;
};

const cursorPredicate = (
  cursor: CursorPayload,
  primary: SQL,
  direction: MediaResultsSortDirection,
  sortType: MediaResultsSortType,
): SQL => {
  const primaryValue = cursorPrimaryValue(cursor.primary, sortType);
  const primaryEqual =
    cursor.primary === null
      ? isNull(primary)
      : sql<boolean>`${primary} = ${primaryValue}`;
  const primaryAfter =
    cursor.primary === null
      ? undefined
      : direction === 'Asc'
        ? or(sql<boolean>`${primary} > ${primaryValue}`, isNull(primary))
        : or(sql<boolean>`${primary} < ${primaryValue}`, isNull(primary));

  return sqlOr(
    primaryAfter,
    and(primaryEqual, gt(currentNormalizedPath, cursor.path)),
    and(
      primaryEqual,
      eq(currentNormalizedPath, cursor.path),
      gt(currentNormalizedName, cursor.name),
    ),
    and(
      primaryEqual,
      eq(currentNormalizedPath, cursor.path),
      eq(currentNormalizedName, cursor.name),
      gt(currentRawName, cursor.rawName),
    ),
    and(
      primaryEqual,
      eq(currentNormalizedPath, cursor.path),
      eq(currentNormalizedName, cursor.name),
      eq(currentRawName, cursor.rawName),
      gt(dbFile.id, cursor.id),
    ),
  );
};

const folderFilterPredicate = (folders: FolderFields[]): SQL | undefined => {
  if (!folders.length) return undefined;
  return or(
    ...folders.map((folder) => pathWithinFolder(dbFile.relativePath, folder)),
  );
};

const childBranchPathExpression = (parentPath: string): SQL<string> => {
  const relativeTail = parentPath
    ? sql<string>`SUBSTRING(${dbFile.relativePath} FROM CHAR_LENGTH(${parentPath}) + 2)`
    : dbFile.relativePath;
  const childName = sql<string>`SPLIT_PART(${relativeTail}, '/', 1)`;
  return parentPath
    ? sql<string>`${parentPath} || '/' || ${childName}`
    : childName;
};

const selectedChildPaths = (
  selectedFolders: readonly FolderFields[],
  parent: FolderFields,
): string[] => {
  const parentPath = parent.relativePath ?? '';
  const prefix = parentPath ? `${parentPath}/` : '';
  return [
    ...new Set(
      selectedFolders.flatMap(({ relativePath }) => {
        const selectedPath = relativePath ?? '';
        if (selectedPath === parentPath || !selectedPath.startsWith(prefix)) {
          return [];
        }
        const childName = selectedPath.slice(prefix.length).split('/')[0];
        if (!childName) return [];
        return [parentPath ? `${parentPath}/${childName}` : childName];
      }),
    ),
  ];
};

const folderFacetFingerprint = (
  selectionFingerprint: string,
  parentFolderId: number,
): string =>
  createHash('sha256')
    .update(JSON.stringify({ selectionFingerprint, parentFolderId }))
    .digest('base64url');

const decodeFolderFacetCursor = (
  encoded: string,
  fingerprint: string,
  parentFolderId: number,
): FolderFacetCursorPayload => {
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    );
    if (typeof parsed !== 'object' || parsed === null) throw new Error();
    const value = parsed as Partial<FolderFacetCursorPayload>;
    if (
      value.version !== 1 ||
      value.fingerprint !== fingerprint ||
      value.parentFolderId !== parentFolderId ||
      typeof value.path !== 'string' ||
      !Number.isInteger(value.id) ||
      Number(value.id) <= 0
    ) {
      throw new Error();
    }
    return value as FolderFacetCursorPayload;
  } catch {
    return badInput('Invalid or expired media folder facet cursor');
  }
};

const matchSourceFor = (
  file: FileFields,
  tokens: SearchToken[],
  scopePath: string | null,
): 'Filename' | 'FolderPath' | null => {
  if (!tokens.length) return null;
  const normalizedName = normalizeSearchText(file.name);
  if (tokens.every(({ normalized }) => normalizedName.includes(normalized))) {
    return 'Filename';
  }
  const path = normalizeSearchText(
    relativeFolderPath(file.relativePath, scopePath),
  );
  return tokens.some(({ normalized }) => path.includes(normalized))
    ? 'FolderPath'
    : 'Filename';
};

export class AuthorizedMediaResultsSelection {
  readonly rootFolder: FolderFields;
  readonly filters: MediaFilterCriteria;
  readonly selectedFolders: FolderFields[];
  readonly query: string;
  readonly sort: MediaResultsSortInput;
  readonly selectionFingerprint: string;
  private readonly tokens: SearchToken[];
  private readonly cursorFingerprint: string;

  constructor({
    rootFolder,
    filters,
    selectedFolders,
    query,
    sort,
  }: {
    rootFolder: FolderFields;
    filters: MediaFilterCriteria;
    selectedFolders: FolderFields[];
    query: string;
    sort: MediaResultsSortInput;
  }) {
    this.rootFolder = rootFolder;
    this.filters = filters;
    this.selectedFolders = selectedFolders;
    this.query = query;
    this.sort = sort;
    this.tokens = searchTokensFor(query);
    this.selectionFingerprint = createHash('sha256')
      .update(
        JSON.stringify({
          folderId: rootFolder.id,
          query: this.tokens,
          filters: mediaCriteriaFingerprint(filters),
          folderIds: selectedFolders.map(({ id }) => id).sort((a, b) => a - b),
        }),
      )
      .digest('base64url');
    this.cursorFingerprint = createHash('sha256')
      .update(JSON.stringify({ selection: this.selectionFingerprint, sort }))
      .digest('base64url');
  }

  private where({ includeFolderFilter = true } = {}): SQL {
    const folderFilter = includeFolderFilter
      ? folderFilterPredicate(this.selectedFolders)
      : undefined;
    return sqlAnd(
      eq(dbFile.exists, true),
      eq(dbFolder.exists, true),
      pathWithinFolder(dbFile.relativePath, this.rootFolder),
      ...filterPredicates(this.filters),
      ...this.tokens.map((token) =>
        tokenPredicate(token, this.rootFolder.relativePath ?? ''),
      ),
      folderFilter,
    );
  }

  async summary(): Promise<MediaMatchSummaryValue> {
    const [row] = await db
      .select({
        directCount:
          sql<number>`COUNT(*) FILTER (WHERE ${dbFile.folderId} = ${this.rootFolder.id})`.mapWith(
            Number,
          ),
        treeCount: count(),
      })
      .from(dbFile)
      .innerJoin(dbFolder, eq(dbFolder.id, dbFile.folderId))
      .where(this.where());
    return {
      directCount: row.directCount,
      treeCount: row.treeCount,
      selectionFingerprint: this.selectionFingerprint,
    };
  }

  async totals(): Promise<{ totalCount: number; folderCount: number }> {
    const [row] = await db
      .select({
        totalCount: count(),
        folderCount: countDistinct(dbFile.folderId),
      })
      .from(dbFile)
      .innerJoin(dbFolder, eq(dbFolder.id, dbFile.folderId))
      .where(this.where());
    return {
      totalCount: row.totalCount,
      folderCount: row.folderCount,
    };
  }

  async page({
    first = DEFAULT_MEDIA_RESULTS_PAGE_SIZE,
    after,
  }: {
    first?: number | null;
    after?: string | null;
  }): Promise<MediaResultsPageValue> {
    const pageSize = first ?? DEFAULT_MEDIA_RESULTS_PAGE_SIZE;
    if (
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > MAX_MEDIA_RESULTS_PAGE_SIZE
    ) {
      badInput(`first must be between 1 and ${MAX_MEDIA_RESULTS_PAGE_SIZE}`);
    }
    const primary = primarySortExpression(this.sort.type);
    const cursor = after
      ? decodeCursor(after, this.cursorFingerprint, this.sort.type)
      : null;
    const afterWhere = cursor
      ? cursorPredicate(cursor, primary, this.sort.direction, this.sort.type)
      : undefined;
    const primaryDirection =
      this.sort.direction === 'Asc' ? sql.raw('ASC') : sql.raw('DESC');
    const rows = await db
      .select({
        file: dbFile,
        folder: dbFolder,
        primary,
        sortPath: currentNormalizedPath,
        sortName: currentNormalizedName,
        sortRawName: currentRawName,
      })
      .from(dbFile)
      .innerJoin(dbFolder, eq(dbFolder.id, dbFile.folderId))
      .where(and(this.where(), afterWhere))
      .orderBy(
        sql`${primary} ${primaryDirection} NULLS LAST`,
        asc(currentNormalizedPath),
        asc(currentNormalizedName),
        asc(currentRawName),
        asc(dbFile.id),
      )
      .limit(pageSize + 1);
    const hasNextPage = rows.length > pageSize;
    const pageRows = rows.slice(0, pageSize) as SelectedFileRow[];
    const edges = pageRows.map((row) => {
      const cursorValue = encodeOpaqueCursor({
        version: 1,
        fingerprint: this.cursorFingerprint,
        primary: scalarCursorValue(row.primary),
        path: row.sortPath,
        name: row.sortName,
        rawName: row.sortRawName,
        id: row.file.id,
      });
      return {
        cursor: cursorValue,
        file: fileToJSON(row.file),
        folder: row.folder,
        relativePath: relativeFolderPath(
          row.folder.relativePath,
          this.rootFolder.relativePath,
        ),
        matchSource: matchSourceFor(
          row.file,
          this.tokens,
          this.rootFolder.relativePath,
        ),
      };
    });
    return {
      edges,
      pageInfo: {
        hasNextPage,
        endCursor: edges.at(-1)?.cursor ?? null,
      },
    };
  }

  private async folderFacetParent(
    requestedId: number | string | null | undefined,
  ): Promise<FolderFields> {
    if (requestedId == null) return this.rootFolder;
    const id = parseNumericId(requestedId, 'folder facet parent ID');
    const parent = await db.query.dbFolder.findFirst({
      where: and(eq(dbFolder.id, id), eq(dbFolder.exists, true)),
    });
    if (!parent || !folderIsUnderFolder(parent, this.rootFolder)) {
      return badInput(
        'Folder facet parent must be within the media results scope',
      );
    }
    return parent;
  }

  async folderFacets({
    parentFolderId,
    first = DEFAULT_MEDIA_FOLDER_FACETS_PAGE_SIZE,
    after,
  }: {
    parentFolderId?: number | string | null;
    first?: number | null;
    after?: string | null;
  } = {}): Promise<MediaFolderFacetsPageValue> {
    const pageSize = first ?? DEFAULT_MEDIA_FOLDER_FACETS_PAGE_SIZE;
    if (
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > MAX_MEDIA_FOLDER_FACETS_PAGE_SIZE
    ) {
      badInput(
        `folder facet first must be between 1 and ${MAX_MEDIA_FOLDER_FACETS_PAGE_SIZE}`,
      );
    }
    const parent = await this.folderFacetParent(parentFolderId);
    const parentPath = parent.relativePath ?? '';
    const branchPath = childBranchPathExpression(parentPath);
    // Keep the parameterised branch expression in one SELECT. Repeating it in
    // GROUP BY gives PostgreSQL different bind parameters for otherwise equal
    // expressions, so it cannot prove that the selected value is grouped.
    const matchedBranches = db
      .select({
        path: branchPath.as('path'),
      })
      .from(dbFile)
      .innerJoin(dbFolder, eq(dbFolder.id, dbFile.folderId))
      .where(
        sqlAnd(
          this.where({ includeFolderFilter: false }),
          pathWithinFolder(dbFile.relativePath, parent),
          sql`${dbFile.relativePath} <> ${parentPath}`,
        ),
      )
      .as('matched_media_folder_branches');
    const branchCounts = db
      .select({
        path: matchedBranches.path,
        count: count().as('count'),
      })
      .from(matchedBranches)
      .groupBy(matchedBranches.path)
      .as('media_folder_branch_counts');
    const countValue = sql<number>`COALESCE(${branchCounts.count}, 0)`.mapWith(
      Number,
    );
    const selectedPaths = selectedChildPaths(this.selectedFolders, parent);
    const visible = sqlOr(
      gt(branchCounts.count, 0),
      selectedPaths.length
        ? inArray(dbFolder.relativePath, selectedPaths)
        : undefined,
    );
    const fingerprint = folderFacetFingerprint(
      this.selectionFingerprint,
      parent.id,
    );
    const cursor = after
      ? decodeFolderFacetCursor(after, fingerprint, parent.id)
      : null;
    const sortPath = sql<string>`${dbFolder.relativePath} COLLATE "C"`;
    const afterWhere = cursor
      ? sqlOr(
          gt(sortPath, cursor.path),
          and(eq(sortPath, cursor.path), gt(dbFolder.id, cursor.id)),
        )
      : undefined;
    const rows = await db
      .select({ folder: dbFolder, count: countValue, sortPath })
      .from(dbFolder)
      .leftJoin(branchCounts, eq(branchCounts.path, dbFolder.relativePath))
      .where(
        sqlAnd(
          eq(dbFolder.parentId, parent.id),
          eq(dbFolder.exists, true),
          visible,
          afterWhere,
        ),
      )
      .orderBy(asc(sortPath), asc(dbFolder.id))
      .limit(pageSize + 1);
    const hasNextPage = rows.length > pageSize;
    const pageRows = rows.slice(0, pageSize);
    const facets = pageRows.map(({ folder, count: facetCount }) => ({
      folder,
      count: facetCount,
      relativePath: relativeFolderPath(
        folder.relativePath,
        this.rootFolder.relativePath,
      ),
    }));
    const last = pageRows.at(-1);
    return {
      facets,
      pageInfo: {
        hasNextPage,
        endCursor: last
          ? encodeOpaqueCursor({
              version: 1,
              fingerprint,
              parentFolderId: parent.id,
              path: last.sortPath,
              id: last.folder.id,
            })
          : null,
      },
    };
  }
}

const selectedFoldersFor = async (
  requestedIds: readonly (number | string)[] | null | undefined,
  rootFolder: FolderFields,
): Promise<FolderFields[]> => {
  const ids = [
    ...new Set(
      (requestedIds ?? []).map((id) => parseNumericId(id, 'folder filter ID')),
    ),
  ].sort((a, b) => a - b);
  if (ids.length > MAX_MEDIA_RESULTS_FOLDER_FILTERS) {
    badInput(
      `No more than ${MAX_MEDIA_RESULTS_FOLDER_FILTERS} folder filters may be selected`,
    );
  }
  if (!ids.length) return [];
  const folders = await db.query.dbFolder.findMany({
    where: and(inArray(dbFolder.id, ids), eq(dbFolder.exists, true)),
  });
  if (
    folders.length !== ids.length ||
    folders.some((folder) => !folderIsUnderFolder(folder, rootFolder))
  ) {
    badInput('Folder filter must be within the media results scope');
  }
  return folders.sort((a, b) => a.id - b.id);
};

export const createAuthorizedMediaResultsSelection = async (
  context: PicrRequestContext,
  input: MediaResultsSelectionInput,
): Promise<AuthorizedMediaResultsSelection> => {
  const folderId = parseNumericId(input.folderId, 'folder ID');
  const { folder, user } = await contextPermissions(context, folderId, 'View');
  const rootFolder: FolderFields = folder;
  const canViewReview = user.commentPermissions !== 'none';
  const requested = input.filters;
  const filters = normalizeMediaFilterCriteria(
    {
      ...defaultMediaFilterCriteria,
      mediaType: requested?.mediaType ?? undefined,
      aspect: requested?.aspect ?? undefined,
      flag: requested?.flag ?? undefined,
      ratingComparison: requested?.rating?.comparison ?? undefined,
      rating: requested?.rating?.value ?? undefined,
      comments: requested?.comments ?? undefined,
    },
    { canViewReview },
  );
  const selectedFolders = await selectedFoldersFor(
    requested?.folderIds,
    rootFolder,
  );
  return new AuthorizedMediaResultsSelection({
    rootFolder,
    filters,
    selectedFolders,
    query: canonicalQuery(input.query),
    sort: input.sort ?? { type: 'Filename', direction: 'Asc' },
  });
};
