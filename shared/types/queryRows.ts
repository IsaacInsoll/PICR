import type {
  AccessLogsQueryQuery,
  ManageFolderQueryQuery,
  ReadAllFoldersQueryQuery,
  ViewBrandingsQueryQuery,
} from '../gql/graphql.js';

export type BrandingRow = NonNullable<
  ViewBrandingsQueryQuery['brandings'][number]
>;

export type AllFoldersRow = NonNullable<
  ReadAllFoldersQueryQuery['allFolders'][number]
>;

export type ManageFolderUserRow = NonNullable<
  ManageFolderQueryQuery['users'][number]
>;

export type AccessLogRow = AccessLogsQueryQuery['accessLogs'][number];
