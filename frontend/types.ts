import type {
  AppCommentHistoryCommentFragmentFragment,
  AppRecentUserFragmentFragment,
  AppSearchFileFragmentFragment,
  AppSearchFolderFragmentFragment,
  AppViewFolderFileFragmentFragment,
  AppViewFolderSubFolderFragmentFragment,
  FileFragmentFragment,
  FileType,
  FolderFragmentFragment,
  MinimumFolderFragmentFragment,
  UserFragmentFragment,
} from '../shared/gql/graphql.js';

type CommentFile = NonNullable<
  AppCommentHistoryCommentFragmentFragment['file']
>;
type GqlFile =
  | FileFragmentFragment
  | AppSearchFileFragmentFragment
  | AppViewFolderFileFragmentFragment
  | CommentFile;
type GqlFolder =
  | FolderFragmentFragment
  | MinimumFolderFragmentFragment
  | AppSearchFolderFragmentFragment
  | AppViewFolderSubFolderFragmentFragment
  | NonNullable<AppRecentUserFragmentFragment['folder']>
  | NonNullable<UserFragmentFragment['folder']>;
type GqlUser =
  | UserFragmentFragment
  | AppRecentUserFragmentFragment
  | NonNullable<AppViewFolderSubFolderFragmentFragment['users']>[number];

export interface PicrFile {
  id: GqlFile['id'];
  type: FileType;
  __typename?: string;
  name?: string | null;
  folderId?: string;
  fileHash?: string;
  fileSize?: number | null;
  fileCreated?: string | null;
  fileLastModified?: string | null;
  latestComment?: string | null;
  flag?: GqlFile['flag'];
  rating?: number | null;
  totalComments?: number | null;
  blurHash?: string;
  imageRatio?: number | null;
  duration?: number | null;
  metadata?: Record<string, string | number | null | undefined> | null;
  isHeroImage?: boolean;
  folder?: PicrFolder | null;
}

export interface PicrFolder {
  id: GqlFolder['id'];
  __typename?: string;
  name?: string | null;
  title?: string | null;
  subtitle?: string | null;
  parentId?: string | null;
  parents?: PicrFolder[];
  relativePath?: string;
  folderLastModified?: unknown;
  heroImage?: PicrFile | null;
  files?: PicrFile[];
  users?: PicrUser[] | null;
  brandingId?: string | null;
  branding?: FolderFragmentFragment['branding'] | null;
}

export interface PicrUser {
  id?: GqlUser['id'] | null;
  name?: GqlUser['name'] | null;
  username?: string | null;
  enabled?: boolean | null;
  uuid?: string | null;
  folderId?: string;
  commentPermissions?: UserFragmentFragment['commentPermissions'];
  linkMode?: UserFragmentFragment['linkMode'];
  gravatar?: string | null;
  ntfy?: string | null;
  ntfyEmail?: boolean | null;
  folder?: PicrFolder | null;
}
