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
} from '../gql/graphql.js';
import type { PicrFileMetadata } from './metadata.js';

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

export type PicrFile = {
  id: GqlFile['id'];
  type: FileType;
  __typename?: string;
  name?: string | null;
  folderId?: string;
  fileHash?: string;
  fileSize?: GqlFile['fileSize'] | null;
  fileCreated?: string | null;
  fileLastModified?: string | null;
  latestComment?: string | null;
  flag?: GqlFile['flag'];
  rating?: number | null;
  totalComments?: number | null;
  blurHash?: string;
  imageRatio?: number | null;
  duration?: number | null;
  isHeroImage?: boolean;
  folder?: PicrFolder | null;
  metadata?: PicrFileMetadata | null;
};

export type PicrFolder = {
  id: GqlFolder['id'];
  __typename?: string;
  name?: string | null;
  title?: string | null;
  subtitle?: string | null;
  parentId?: string | null;
  parents?: PicrFolder[];
  relativePath?: string;
  folderLastModified?: string | null;
  heroImage?: PicrFile | null;
  files?: PicrFile[];
  users?: PicrUser[] | null;
  brandingId?: string | null;
  branding?: FolderFragmentFragment['branding'] | null;
};

export type PicrUser = {
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
};
