/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** The `BigInt` scalar type represents non-fractional signed whole numeric values. */
  BigInt: { input: any; output: any; }
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: { input: any; output: any; }
};

export type AccessLog = {
  __typename?: 'AccessLog';
  folder?: Maybe<Folder>;
  folderId?: Maybe<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  ipAddress?: Maybe<Scalars['String']['output']>;
  timestamp: Scalars['DateTime']['output'];
  type: AccessType;
  user?: Maybe<User>;
  userAgent?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['ID']['output']>;
};

export enum AccessType {
  Download = 'Download',
  View = 'View'
}

export type Branding = {
  __typename?: 'Branding';
  folder?: Maybe<Folder>;
  folderId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  logoUrl?: Maybe<Scalars['String']['output']>;
  mode?: Maybe<ThemeMode>;
  primaryColor?: Maybe<PrimaryColor>;
};

export type ClientInfo = {
  __typename?: 'ClientInfo';
  avifEnabled: Scalars['Boolean']['output'];
};

export type Comment = {
  __typename?: 'Comment';
  comment?: Maybe<Scalars['String']['output']>;
  file?: Maybe<File>;
  id?: Maybe<Scalars['ID']['output']>;
  systemGenerated: Scalars['Boolean']['output'];
  timestamp: Scalars['DateTime']['output'];
  user?: Maybe<User>;
  userId?: Maybe<Scalars['ID']['output']>;
};

export enum CommentPermissions {
  Edit = 'edit',
  None = 'none',
  Read = 'read'
}

export type File = FileInterface & {
  __typename?: 'File';
  fileHash: Scalars['String']['output'];
  fileLastModified: Scalars['DateTime']['output'];
  fileSize: Scalars['BigInt']['output'];
  flag?: Maybe<FileFlag>;
  folder?: Maybe<Folder>;
  folderId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  latestComment?: Maybe<Scalars['DateTime']['output']>;
  name: Scalars['String']['output'];
  rating?: Maybe<Scalars['Int']['output']>;
  totalComments?: Maybe<Scalars['Int']['output']>;
  type: FileType;
};

export enum FileFlag {
  Approved = 'approved',
  None = 'none',
  Rejected = 'rejected'
}

export type FileInterface = {
  fileHash: Scalars['String']['output'];
  fileLastModified: Scalars['DateTime']['output'];
  fileSize: Scalars['BigInt']['output'];
  flag?: Maybe<FileFlag>;
  folder?: Maybe<Folder>;
  folderId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  latestComment?: Maybe<Scalars['DateTime']['output']>;
  name: Scalars['String']['output'];
  rating?: Maybe<Scalars['Int']['output']>;
  totalComments?: Maybe<Scalars['Int']['output']>;
  type: FileType;
};

export enum FileType {
  File = 'File',
  Image = 'Image',
  Video = 'Video'
}

export type Folder = {
  __typename?: 'Folder';
  branding?: Maybe<Branding>;
  files: Array<FileInterface>;
  folderLastModified: Scalars['DateTime']['output'];
  heroImage?: Maybe<Image>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  parentId?: Maybe<Scalars['ID']['output']>;
  parents: Array<Folder>;
  permissions?: Maybe<FolderPermissions>;
  subFolders: Array<Folder>;
  totalDirectSize: Scalars['String']['output'];
  totalFiles: Scalars['Int']['output'];
  totalFolders: Scalars['Int']['output'];
  totalImages: Scalars['Int']['output'];
  totalSize: Scalars['String']['output'];
  users?: Maybe<Array<User>>;
};

export enum FolderPermissions {
  Admin = 'Admin',
  None = 'None',
  View = 'View'
}

export enum FoldersSortType {
  FolderLastModified = 'folderLastModified',
  Name = 'name'
}

export type Image = FileInterface & {
  __typename?: 'Image';
  blurHash: Scalars['String']['output'];
  fileHash: Scalars['String']['output'];
  fileLastModified: Scalars['DateTime']['output'];
  fileSize: Scalars['BigInt']['output'];
  flag?: Maybe<FileFlag>;
  folder?: Maybe<Folder>;
  folderId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  imageRatio?: Maybe<Scalars['Float']['output']>;
  latestComment?: Maybe<Scalars['DateTime']['output']>;
  metadata?: Maybe<ImageMetadataSummary>;
  name: Scalars['String']['output'];
  rating?: Maybe<Scalars['Int']['output']>;
  totalComments?: Maybe<Scalars['Int']['output']>;
  type: FileType;
};

export type ImageMetadataSummary = {
  __typename?: 'ImageMetadataSummary';
  Aperture?: Maybe<Scalars['Float']['output']>;
  Artist?: Maybe<Scalars['String']['output']>;
  Camera?: Maybe<Scalars['String']['output']>;
  DateTimeEdit?: Maybe<Scalars['String']['output']>;
  DateTimeOriginal?: Maybe<Scalars['String']['output']>;
  ExposureTime?: Maybe<Scalars['Float']['output']>;
  Height?: Maybe<Scalars['Int']['output']>;
  ISO?: Maybe<Scalars['Float']['output']>;
  Lens?: Maybe<Scalars['String']['output']>;
  Rating?: Maybe<Scalars['Int']['output']>;
  Width?: Maybe<Scalars['Int']['output']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  addComment: FileInterface;
  auth: Scalars['String']['output'];
  deleteBranding: Folder;
  editAdminUser: User;
  editBranding: Folder;
  editFolder: Folder;
  editUser: User;
  generateThumbnails: Scalars['Boolean']['output'];
  generateZip: Scalars['String']['output'];
};


export type MutationAddCommentArgs = {
  comment?: InputMaybe<Scalars['String']['input']>;
  flag?: InputMaybe<FileFlag>;
  id: Scalars['ID']['input'];
  nickName?: InputMaybe<Scalars['String']['input']>;
  rating?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationAuthArgs = {
  password: Scalars['String']['input'];
  user: Scalars['String']['input'];
};


export type MutationDeleteBrandingArgs = {
  folderId: Scalars['ID']['input'];
};


export type MutationEditAdminUserArgs = {
  commentPermissions?: InputMaybe<CommentPermissions>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  folderId?: InputMaybe<Scalars['ID']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  ntfy?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};


export type MutationEditBrandingArgs = {
  folderId: Scalars['ID']['input'];
  logoUrl?: InputMaybe<Scalars['String']['input']>;
  mode?: InputMaybe<ThemeMode>;
  primaryColor?: InputMaybe<PrimaryColor>;
};


export type MutationEditFolderArgs = {
  folderId: Scalars['ID']['input'];
  heroImageId?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationEditUserArgs = {
  commentPermissions?: InputMaybe<CommentPermissions>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  folderId?: InputMaybe<Scalars['ID']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['String']['input']>;
};


export type MutationGenerateThumbnailsArgs = {
  folderId?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationGenerateZipArgs = {
  folderId?: InputMaybe<Scalars['ID']['input']>;
};

export enum PrimaryColor {
  Blue = 'blue',
  Cyan = 'cyan',
  Dark = 'dark',
  Grape = 'grape',
  Gray = 'gray',
  Green = 'green',
  Indigo = 'indigo',
  Lime = 'lime',
  Orange = 'orange',
  Pink = 'pink',
  Red = 'red',
  Teal = 'teal',
  Violet = 'violet',
  Yellow = 'yellow'
}

export type Query = {
  __typename?: 'Query';
  accessLogs: Array<AccessLog>;
  admins: Array<User>;
  allFolders: Array<Maybe<Folder>>;
  brandings: Array<Branding>;
  clientInfo?: Maybe<ClientInfo>;
  comments: Array<Comment>;
  file: FileInterface;
  folder: Folder;
  me?: Maybe<User>;
  searchFiles: Array<File>;
  searchFolders: Array<Folder>;
  serverInfo?: Maybe<ServerInfo>;
  tasks: Array<Task>;
  user: User;
  users: Array<User>;
};


export type QueryAccessLogsArgs = {
  folderId: Scalars['ID']['input'];
  includeChildren?: InputMaybe<Scalars['Boolean']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
  userType?: InputMaybe<UserType>;
};


export type QueryAllFoldersArgs = {
  id: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<FoldersSortType>;
};


export type QueryCommentsArgs = {
  fileId?: InputMaybe<Scalars['ID']['input']>;
  folderId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryFileArgs = {
  id: Scalars['ID']['input'];
};


export type QueryFolderArgs = {
  id: Scalars['ID']['input'];
};


export type QuerySearchFilesArgs = {
  folderId?: InputMaybe<Scalars['ID']['input']>;
  query: Scalars['String']['input'];
};


export type QuerySearchFoldersArgs = {
  folderId?: InputMaybe<Scalars['ID']['input']>;
  query: Scalars['String']['input'];
};


export type QueryTasksArgs = {
  folderId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUsersArgs = {
  folderId: Scalars['ID']['input'];
  includeChildren?: InputMaybe<Scalars['Boolean']['input']>;
  includeParents?: InputMaybe<Scalars['Boolean']['input']>;
  sortByRecent?: InputMaybe<Scalars['Boolean']['input']>;
};

export type ServerInfo = {
  __typename?: 'ServerInfo';
  cacheSize: Scalars['BigInt']['output'];
  databaseUrl: Scalars['String']['output'];
  dev: Scalars['Boolean']['output'];
  host: Scalars['String']['output'];
  latest: Scalars['String']['output'];
  mediaSize: Scalars['BigInt']['output'];
  usePolling: Scalars['Boolean']['output'];
  version: Scalars['String']['output'];
};

export type Task = {
  __typename?: 'Task';
  folder?: Maybe<Folder>;
  id?: Maybe<Scalars['ID']['output']>;
  name: Scalars['String']['output'];
  startTime?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  step?: Maybe<Scalars['Int']['output']>;
  totalSteps?: Maybe<Scalars['Int']['output']>;
};

export enum ThemeMode {
  Auto = 'auto',
  Dark = 'dark',
  Light = 'light'
}

export type User = {
  __typename?: 'User';
  commentPermissions?: Maybe<CommentPermissions>;
  enabled?: Maybe<Scalars['Boolean']['output']>;
  folder?: Maybe<Folder>;
  folderId: Scalars['ID']['output'];
  gravatar?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  lastAccess?: Maybe<Scalars['DateTime']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  ntfy?: Maybe<Scalars['String']['output']>;
  userType?: Maybe<UserType>;
  username?: Maybe<Scalars['String']['output']>;
  uuid?: Maybe<Scalars['String']['output']>;
};

export enum UserType {
  Admin = 'Admin',
  All = 'All',
  Link = 'Link',
  User = 'User'
}

export type Video = FileInterface & {
  __typename?: 'Video';
  duration?: Maybe<Scalars['Float']['output']>;
  fileHash: Scalars['String']['output'];
  fileLastModified: Scalars['DateTime']['output'];
  fileSize: Scalars['BigInt']['output'];
  flag?: Maybe<FileFlag>;
  folder?: Maybe<Folder>;
  folderId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  imageRatio?: Maybe<Scalars['Float']['output']>;
  latestComment?: Maybe<Scalars['DateTime']['output']>;
  metadata?: Maybe<VideoMetadataSummary>;
  name: Scalars['String']['output'];
  rating?: Maybe<Scalars['Int']['output']>;
  totalComments?: Maybe<Scalars['Int']['output']>;
  type: FileType;
};

export type VideoMetadataSummary = {
  __typename?: 'VideoMetadataSummary';
  AudioCodec?: Maybe<Scalars['String']['output']>;
  AudioCodecDescription?: Maybe<Scalars['String']['output']>;
  Bitrate?: Maybe<Scalars['Int']['output']>;
  Duration?: Maybe<Scalars['Float']['output']>;
  Format?: Maybe<Scalars['String']['output']>;
  Framerate?: Maybe<Scalars['Float']['output']>;
  Height?: Maybe<Scalars['Int']['output']>;
  VideoCodec?: Maybe<Scalars['String']['output']>;
  VideoCodecDescription?: Maybe<Scalars['String']['output']>;
  Width?: Maybe<Scalars['Int']['output']>;
};

export type DeleteBrandingMutationMutationVariables = Exact<{
  folderId: Scalars['ID']['input'];
}>;


export type DeleteBrandingMutationMutation = { __typename?: 'Mutation', deleteBranding: { __typename: 'Folder', id: string, name: string, parentId?: string | null, permissions?: FolderPermissions | null, folderLastModified: any, parents: Array<{ __typename?: 'Folder', id: string, name: string }>, branding?: { __typename?: 'Branding', id: string, folderId: string, mode?: ThemeMode | null, primaryColor?: PrimaryColor | null, logoUrl?: string | null, folder?: { __typename?: 'Folder', id: string, name: string } | null } | null, heroImage?: { __typename?: 'Image', id: string, name: string, fileHash: string, imageRatio?: number | null, blurHash: string } | null } };

type FileFragment_File_Fragment = { __typename: 'File', id: string, name: string, type: FileType, fileHash: string, fileSize: any, fileLastModified: any, flag?: FileFlag | null, rating?: number | null, totalComments?: number | null, latestComment?: any | null, folderId: string };

type FileFragment_Image_Fragment = { __typename: 'Image', imageRatio?: number | null, blurHash: string, id: string, name: string, type: FileType, fileHash: string, fileSize: any, fileLastModified: any, flag?: FileFlag | null, rating?: number | null, totalComments?: number | null, latestComment?: any | null, folderId: string, metadata?: { __typename?: 'ImageMetadataSummary', Camera?: string | null, Lens?: string | null, Artist?: string | null, DateTimeOriginal?: string | null, DateTimeEdit?: string | null, Aperture?: number | null, ExposureTime?: number | null, ISO?: number | null, Width?: number | null, Height?: number | null, Rating?: number | null } | null };

type FileFragment_Video_Fragment = { __typename: 'Video', imageRatio?: number | null, duration?: number | null, id: string, name: string, type: FileType, fileHash: string, fileSize: any, fileLastModified: any, flag?: FileFlag | null, rating?: number | null, totalComments?: number | null, latestComment?: any | null, folderId: string, metadata?: { __typename?: 'VideoMetadataSummary', Bitrate?: number | null, Duration?: number | null, Format?: string | null, VideoCodec?: string | null, VideoCodecDescription?: string | null, Width?: number | null, Height?: number | null, Framerate?: number | null, AudioCodec?: string | null, AudioCodecDescription?: string | null } | null };

export type FileFragmentFragment = FileFragment_File_Fragment | FileFragment_Image_Fragment | FileFragment_Video_Fragment;

export type FolderFragmentFragment = { __typename: 'Folder', id: string, name: string, parentId?: string | null, permissions?: FolderPermissions | null, folderLastModified: any, parents: Array<{ __typename?: 'Folder', id: string, name: string }>, branding?: { __typename?: 'Branding', id: string, folderId: string, mode?: ThemeMode | null, primaryColor?: PrimaryColor | null, logoUrl?: string | null, folder?: { __typename?: 'Folder', id: string, name: string } | null } | null, heroImage?: { __typename?: 'Image', id: string, name: string, fileHash: string, imageRatio?: number | null, blurHash: string } | null };

export type HeroImageFragmentFragment = { __typename?: 'Folder', heroImage?: { __typename?: 'Image', id: string, name: string, fileHash: string, imageRatio?: number | null, blurHash: string } | null };

export type ImageMetadataFragmentFragment = { __typename?: 'Image', metadata?: { __typename?: 'ImageMetadataSummary', Camera?: string | null, Lens?: string | null, Artist?: string | null, DateTimeOriginal?: string | null, DateTimeEdit?: string | null, Aperture?: number | null, ExposureTime?: number | null, ISO?: number | null, Width?: number | null, Height?: number | null, Rating?: number | null } | null };

export type MinimumFolderFragmentFragment = { __typename: 'Folder', id: string, name: string, parentId?: string | null, heroImage?: { __typename?: 'Image', id: string, name: string, fileHash: string, imageRatio?: number | null, blurHash: string } | null };

export type TreeSizeFragmentFragment = { __typename?: 'Folder', id: string, name: string, totalFiles: number, totalFolders: number, totalSize: string, totalDirectSize: string };

export type TreeSizeQueryQueryVariables = Exact<{
  folderId: Scalars['ID']['input'];
}>;


export type TreeSizeQueryQuery = { __typename?: 'Query', folder: { __typename?: 'Folder', id: string, name: string, totalFiles: number, totalFolders: number, totalSize: string, totalDirectSize: string, parents: Array<{ __typename?: 'Folder', id: string, name: string }>, files: Array<{ __typename?: 'File', id: string, name: string, type: FileType, fileSize: any } | { __typename?: 'Image', id: string, name: string, type: FileType, fileSize: any } | { __typename?: 'Video', id: string, name: string, type: FileType, fileSize: any }>, subFolders: Array<{ __typename?: 'Folder', id: string, name: string, totalFiles: number, totalFolders: number, totalSize: string, totalDirectSize: string, subFolders: Array<{ __typename?: 'Folder', id: string, name: string, totalFiles: number, totalFolders: number, totalSize: string, totalDirectSize: string }> }> } };

export type UserFragmentFragment = { __typename?: 'User', id?: string | null, name?: string | null, username?: string | null, enabled?: boolean | null, uuid?: string | null, folderId: string, commentPermissions?: CommentPermissions | null, gravatar?: string | null, ntfy?: string | null, folder?: { __typename?: 'Folder', id: string, name: string, parents: Array<{ __typename?: 'Folder', id: string, name: string }> } | null };

export type VideoMetadataFragmentFragment = { __typename?: 'Video', metadata?: { __typename?: 'VideoMetadataSummary', Bitrate?: number | null, Duration?: number | null, Format?: string | null, VideoCodec?: string | null, VideoCodecDescription?: string | null, Width?: number | null, Height?: number | null, Framerate?: number | null, AudioCodec?: string | null, AudioCodecDescription?: string | null } | null };

export type AddCommentMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  rating?: InputMaybe<Scalars['Int']['input']>;
  flag?: InputMaybe<FileFlag>;
  comment?: InputMaybe<Scalars['String']['input']>;
  nickName?: InputMaybe<Scalars['String']['input']>;
}>;


export type AddCommentMutation = { __typename?: 'Mutation', addComment: { __typename: 'File', id: string, name: string, type: FileType, fileHash: string, fileSize: any, fileLastModified: any, flag?: FileFlag | null, rating?: number | null, totalComments?: number | null, latestComment?: any | null, folderId: string } | { __typename: 'Image', imageRatio?: number | null, blurHash: string, id: string, name: string, type: FileType, fileHash: string, fileSize: any, fileLastModified: any, flag?: FileFlag | null, rating?: number | null, totalComments?: number | null, latestComment?: any | null, folderId: string, metadata?: { __typename?: 'ImageMetadataSummary', Camera?: string | null, Lens?: string | null, Artist?: string | null, DateTimeOriginal?: string | null, DateTimeEdit?: string | null, Aperture?: number | null, ExposureTime?: number | null, ISO?: number | null, Width?: number | null, Height?: number | null, Rating?: number | null } | null } | { __typename: 'Video', imageRatio?: number | null, duration?: number | null, id: string, name: string, type: FileType, fileHash: string, fileSize: any, fileLastModified: any, flag?: FileFlag | null, rating?: number | null, totalComments?: number | null, latestComment?: any | null, folderId: string, metadata?: { __typename?: 'VideoMetadataSummary', Bitrate?: number | null, Duration?: number | null, Format?: string | null, VideoCodec?: string | null, VideoCodecDescription?: string | null, Width?: number | null, Height?: number | null, Framerate?: number | null, AudioCodec?: string | null, AudioCodecDescription?: string | null } | null } };

export type EditAdminUserMutationMutationVariables = Exact<{
  id?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  folderId?: InputMaybe<Scalars['ID']['input']>;
  commentPermissions?: InputMaybe<CommentPermissions>;
  ntfy?: InputMaybe<Scalars['String']['input']>;
}>;


export type EditAdminUserMutationMutation = { __typename?: 'Mutation', editAdminUser: { __typename?: 'User', id?: string | null, name?: string | null, username?: string | null, enabled?: boolean | null, uuid?: string | null, folderId: string, commentPermissions?: CommentPermissions | null, gravatar?: string | null, ntfy?: string | null, folder?: { __typename?: 'Folder', id: string, name: string, parents: Array<{ __typename?: 'Folder', id: string, name: string }> } | null } };

export type EditFolderMutationVariables = Exact<{
  folderId: Scalars['ID']['input'];
  heroImageId: Scalars['ID']['input'];
}>;


export type EditFolderMutation = { __typename?: 'Mutation', editFolder: { __typename: 'Folder', id: string, name: string, parentId?: string | null, permissions?: FolderPermissions | null, folderLastModified: any, parents: Array<{ __typename?: 'Folder', id: string, name: string }>, branding?: { __typename?: 'Branding', id: string, folderId: string, mode?: ThemeMode | null, primaryColor?: PrimaryColor | null, logoUrl?: string | null, folder?: { __typename?: 'Folder', id: string, name: string } | null } | null, heroImage?: { __typename?: 'Image', id: string, name: string, fileHash: string, imageRatio?: number | null, blurHash: string } | null } };

export type EditUserMutationMutationVariables = Exact<{
  id?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['String']['input']>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  folderId?: InputMaybe<Scalars['ID']['input']>;
  commentPermissions?: InputMaybe<CommentPermissions>;
}>;


export type EditUserMutationMutation = { __typename?: 'Mutation', editUser: { __typename?: 'User', id?: string | null, name?: string | null, username?: string | null, enabled?: boolean | null, uuid?: string | null, folderId: string, commentPermissions?: CommentPermissions | null, gravatar?: string | null, ntfy?: string | null, folder?: { __typename?: 'Folder', id: string, name: string, parents: Array<{ __typename?: 'Folder', id: string, name: string }> } | null } };

export type GenerateThumbnailsQueryMutationVariables = Exact<{
  folderId: Scalars['ID']['input'];
}>;


export type GenerateThumbnailsQueryMutation = { __typename?: 'Mutation', generateThumbnails: boolean };

export type GenerateZipMutationVariables = Exact<{
  folderId: Scalars['ID']['input'];
}>;


export type GenerateZipMutation = { __typename?: 'Mutation', generateZip: string };

export type LoginMutationVariables = Exact<{
  username: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type LoginMutation = { __typename?: 'Mutation', auth: string };

export type AccessLogsQueryQueryVariables = Exact<{
  folderId: Scalars['ID']['input'];
  userId?: InputMaybe<Scalars['ID']['input']>;
  includeChildren?: InputMaybe<Scalars['Boolean']['input']>;
  userType?: InputMaybe<UserType>;
}>;


export type AccessLogsQueryQuery = { __typename?: 'Query', accessLogs: Array<{ __typename?: 'AccessLog', id: string, timestamp: any, type: AccessType, userId?: string | null, folderId?: string | null, ipAddress?: string | null, userAgent?: string | null, folder?: { __typename: 'Folder', id: string, name: string, parentId?: string | null, permissions?: FolderPermissions | null, folderLastModified: any, parents: Array<{ __typename?: 'Folder', id: string, name: string }>, branding?: { __typename?: 'Branding', id: string, folderId: string, mode?: ThemeMode | null, primaryColor?: PrimaryColor | null, logoUrl?: string | null, folder?: { __typename?: 'Folder', id: string, name: string } | null } | null, heroImage?: { __typename?: 'Image', id: string, name: string, fileHash: string, imageRatio?: number | null, blurHash: string } | null } | null }> };

export type CommentHistoryQueryQueryVariables = Exact<{
  fileId?: InputMaybe<Scalars['ID']['input']>;
  folderId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type CommentHistoryQueryQuery = { __typename?: 'Query', comments: Array<{ __typename?: 'Comment', id?: string | null, comment?: string | null, systemGenerated: boolean, timestamp: any, userId?: string | null, file?: { __typename: 'File', id: string, name: string, type: FileType, fileHash: string, fileSize: any, fileLastModified: any, flag?: FileFlag | null, rating?: number | null, totalComments?: number | null, latestComment?: any | null, folderId: string } | null, user?: { __typename?: 'User', id?: string | null, gravatar?: string | null, name?: string | null } | null }> };

export type GenerateThumbnailsStatsQueryVariables = Exact<{
  folderId: Scalars['ID']['input'];
}>;


export type GenerateThumbnailsStatsQuery = { __typename?: 'Query', folder: { __typename: 'Folder', totalImages: number, id: string, name: string, parentId?: string | null, permissions?: FolderPermissions | null, folderLastModified: any, parents: Array<{ __typename?: 'Folder', id: string, name: string }>, branding?: { __typename?: 'Branding', id: string, folderId: string, mode?: ThemeMode | null, primaryColor?: PrimaryColor | null, logoUrl?: string | null, folder?: { __typename?: 'Folder', id: string, name: string } | null } | null, heroImage?: { __typename?: 'Image', id: string, name: string, fileHash: string, imageRatio?: number | null, blurHash: string } | null } };

export type ManageFolderQueryQueryVariables = Exact<{
  folderId: Scalars['ID']['input'];
  includeParents: Scalars['Boolean']['input'];
  includeChildren: Scalars['Boolean']['input'];
}>;


export type ManageFolderQueryQuery = { __typename?: 'Query', folder: { __typename: 'Folder', id: string, name: string, parentId?: string | null, permissions?: FolderPermissions | null, folderLastModified: any, parents: Array<{ __typename?: 'Folder', id: string, name: string }>, branding?: { __typename?: 'Branding', id: string, folderId: string, mode?: ThemeMode | null, primaryColor?: PrimaryColor | null, logoUrl?: string | null, folder?: { __typename?: 'Folder', id: string, name: string } | null } | null, heroImage?: { __typename?: 'Image', id: string, name: string, fileHash: string, imageRatio?: number | null, blurHash: string } | null }, users: Array<{ __typename?: 'User', folderId: string, id?: string | null, name?: string | null, username?: string | null, enabled?: boolean | null, uuid?: string | null, commentPermissions?: CommentPermissions | null, gravatar?: string | null, ntfy?: string | null, folder?: { __typename: 'Folder', id: string, name: string, parentId?: string | null, permissions?: FolderPermissions | null, folderLastModified: any, parents: Array<{ __typename?: 'Folder', id: string, name: string }>, branding?: { __typename?: 'Branding', id: string, folderId: string, mode?: ThemeMode | null, primaryColor?: PrimaryColor | null, logoUrl?: string | null, folder?: { __typename?: 'Folder', id: string, name: string } | null } | null, heroImage?: { __typename?: 'Image', id: string, name: string, fileHash: string, imageRatio?: number | null, blurHash: string } | null } | null }> };

export type MeQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQueryQuery = { __typename?: 'Query', me?: { __typename?: 'User', id?: string | null, userType?: UserType | null, name?: string | null, folderId: string, uuid?: string | null, commentPermissions?: CommentPermissions | null, folder?: { __typename?: 'Folder', id: string, name: string } | null } | null, clientInfo?: { __typename?: 'ClientInfo', avifEnabled: boolean } | null };

export type ReadAllFoldersQueryQueryVariables = Exact<{
  id: Scalars['ID']['input'];
  sort?: InputMaybe<FoldersSortType>;
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type ReadAllFoldersQueryQuery = { __typename?: 'Query', allFolders: Array<{ __typename: 'Folder', id: string, name: string, parentId?: string | null, permissions?: FolderPermissions | null, folderLastModified: any, parents: Array<{ __typename?: 'Folder', id: string, name: string }>, branding?: { __typename?: 'Branding', id: string, folderId: string, mode?: ThemeMode | null, primaryColor?: PrimaryColor | null, logoUrl?: string | null, folder?: { __typename?: 'Folder', id: string, name: string } | null } | null, heroImage?: { __typename?: 'Image', id: string, name: string, fileHash: string, imageRatio?: number | null, blurHash: string } | null } | null> };

export type RecentUsersQueryQueryVariables = Exact<{
  folderId: Scalars['ID']['input'];
}>;


export type RecentUsersQueryQuery = { __typename?: 'Query', users: Array<{ __typename?: 'User', id?: string | null, name?: string | null, folderId: string, lastAccess?: any | null, gravatar?: string | null, folder?: { __typename?: 'Folder', id: string, name: string, parents: Array<{ __typename?: 'Folder', id: string, name: string }>, heroImage?: { __typename?: 'Image', id: string, name: string, fileHash: string, imageRatio?: number | null, blurHash: string } | null } | null }> };

export type SearchQueryQueryVariables = Exact<{
  folderId: Scalars['ID']['input'];
  query: Scalars['String']['input'];
}>;


export type SearchQueryQuery = { __typename?: 'Query', searchFolders: Array<{ __typename: 'Folder', id: string, name: string, parentId?: string | null, permissions?: FolderPermissions | null, folderLastModified: any, parents: Array<{ __typename?: 'Folder', id: string, name: string }>, branding?: { __typename?: 'Branding', id: string, folderId: string, mode?: ThemeMode | null, primaryColor?: PrimaryColor | null, logoUrl?: string | null, folder?: { __typename?: 'Folder', id: string, name: string } | null } | null, heroImage?: { __typename?: 'Image', id: string, name: string, fileHash: string, imageRatio?: number | null, blurHash: string } | null }>, searchFiles: Array<{ __typename: 'File', id: string, name: string, type: FileType, fileHash: string, fileSize: any, fileLastModified: any, flag?: FileFlag | null, rating?: number | null, totalComments?: number | null, latestComment?: any | null, folderId: string, folder?: { __typename: 'Folder', id: string, name: string, parentId?: string | null, heroImage?: { __typename?: 'Image', id: string, name: string, fileHash: string, imageRatio?: number | null, blurHash: string } | null } | null }> };

export type ServerInfoQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type ServerInfoQueryQuery = { __typename?: 'Query', serverInfo?: { __typename?: 'ServerInfo', version: string, latest: string, databaseUrl: string, dev: boolean, usePolling: boolean, host: string } | null };

export type ExpensiveServerFileSizeQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type ExpensiveServerFileSizeQueryQuery = { __typename?: 'Query', serverInfo?: { __typename?: 'ServerInfo', cacheSize: any, mediaSize: any } | null };

export type TaskQueryQueryVariables = Exact<{
  folderId: Scalars['ID']['input'];
}>;


export type TaskQueryQuery = { __typename?: 'Query', tasks: Array<{ __typename?: 'Task', id?: string | null, name: string, step?: number | null, totalSteps?: number | null, status?: string | null }> };

export type ViewAdminsQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type ViewAdminsQueryQuery = { __typename?: 'Query', admins: Array<{ __typename?: 'User', id?: string | null, name?: string | null, username?: string | null, enabled?: boolean | null, uuid?: string | null, folderId: string, commentPermissions?: CommentPermissions | null, gravatar?: string | null, ntfy?: string | null, folder?: { __typename?: 'Folder', id: string, name: string, parents: Array<{ __typename?: 'Folder', id: string, name: string }> } | null }> };

export type ViewBrandingsQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type ViewBrandingsQueryQuery = { __typename?: 'Query', brandings: Array<{ __typename?: 'Branding', id: string, logoUrl?: string | null, primaryColor?: PrimaryColor | null, mode?: ThemeMode | null, folderId: string, folder?: { __typename: 'Folder', id: string, name: string, parentId?: string | null, heroImage?: { __typename?: 'Image', id: string, name: string, fileHash: string, imageRatio?: number | null, blurHash: string } | null } | null }> };

export type ViewFileQueryVariables = Exact<{
  fileId: Scalars['ID']['input'];
}>;


export type ViewFileQuery = { __typename?: 'Query', file: { __typename: 'File', id: string, name: string, type: FileType, fileHash: string, fileSize: any, fileLastModified: any, flag?: FileFlag | null, rating?: number | null, totalComments?: number | null, latestComment?: any | null, folderId: string } | { __typename: 'Image', imageRatio?: number | null, blurHash: string, id: string, name: string, type: FileType, fileHash: string, fileSize: any, fileLastModified: any, flag?: FileFlag | null, rating?: number | null, totalComments?: number | null, latestComment?: any | null, folderId: string, metadata?: { __typename?: 'ImageMetadataSummary', Camera?: string | null, Lens?: string | null, Artist?: string | null, DateTimeOriginal?: string | null, DateTimeEdit?: string | null, Aperture?: number | null, ExposureTime?: number | null, ISO?: number | null, Width?: number | null, Height?: number | null, Rating?: number | null } | null } | { __typename: 'Video', imageRatio?: number | null, duration?: number | null, id: string, name: string, type: FileType, fileHash: string, fileSize: any, fileLastModified: any, flag?: FileFlag | null, rating?: number | null, totalComments?: number | null, latestComment?: any | null, folderId: string, metadata?: { __typename?: 'VideoMetadataSummary', Bitrate?: number | null, Duration?: number | null, Format?: string | null, VideoCodec?: string | null, VideoCodecDescription?: string | null, Width?: number | null, Height?: number | null, Framerate?: number | null, AudioCodec?: string | null, AudioCodecDescription?: string | null } | null } };

export type ViewFolderQueryVariables = Exact<{
  folderId: Scalars['ID']['input'];
}>;


export type ViewFolderQuery = { __typename?: 'Query', folder: { __typename: 'Folder', id: string, name: string, parentId?: string | null, permissions?: FolderPermissions | null, folderLastModified: any, files: Array<{ __typename: 'File', id: string, name: string, type: FileType, fileHash: string, fileSize: any, fileLastModified: any, flag?: FileFlag | null, rating?: number | null, totalComments?: number | null, latestComment?: any | null, folderId: string } | { __typename: 'Image', imageRatio?: number | null, blurHash: string, id: string, name: string, type: FileType, fileHash: string, fileSize: any, fileLastModified: any, flag?: FileFlag | null, rating?: number | null, totalComments?: number | null, latestComment?: any | null, folderId: string, metadata?: { __typename?: 'ImageMetadataSummary', Camera?: string | null, Lens?: string | null, Artist?: string | null, DateTimeOriginal?: string | null, DateTimeEdit?: string | null, Aperture?: number | null, ExposureTime?: number | null, ISO?: number | null, Width?: number | null, Height?: number | null, Rating?: number | null } | null } | { __typename: 'Video', imageRatio?: number | null, duration?: number | null, id: string, name: string, type: FileType, fileHash: string, fileSize: any, fileLastModified: any, flag?: FileFlag | null, rating?: number | null, totalComments?: number | null, latestComment?: any | null, folderId: string, metadata?: { __typename?: 'VideoMetadataSummary', Bitrate?: number | null, Duration?: number | null, Format?: string | null, VideoCodec?: string | null, VideoCodecDescription?: string | null, Width?: number | null, Height?: number | null, Framerate?: number | null, AudioCodec?: string | null, AudioCodecDescription?: string | null } | null }>, subFolders: Array<{ __typename: 'Folder', id: string, name: string, parentId?: string | null, users?: Array<{ __typename?: 'User', id?: string | null, name?: string | null, enabled?: boolean | null, commentPermissions?: CommentPermissions | null, gravatar?: string | null }> | null, heroImage?: { __typename?: 'Image', id: string, name: string, fileHash: string, imageRatio?: number | null, blurHash: string } | null }>, parents: Array<{ __typename?: 'Folder', id: string, name: string }>, branding?: { __typename?: 'Branding', id: string, folderId: string, mode?: ThemeMode | null, primaryColor?: PrimaryColor | null, logoUrl?: string | null, folder?: { __typename?: 'Folder', id: string, name: string } | null } | null, heroImage?: { __typename?: 'Image', id: string, name: string, fileHash: string, imageRatio?: number | null, blurHash: string } | null } };

export type ViewUserQueryQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ViewUserQueryQuery = { __typename?: 'Query', user: { __typename?: 'User', id?: string | null, name?: string | null, username?: string | null, enabled?: boolean | null, uuid?: string | null, folderId: string, commentPermissions?: CommentPermissions | null, gravatar?: string | null, ntfy?: string | null, folder?: { __typename?: 'Folder', id: string, name: string, parents: Array<{ __typename?: 'Folder', id: string, name: string }> } | null } };

export const VideoMetadataFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"VideoMetadataFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Video"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Video"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"Bitrate"}},{"kind":"Field","name":{"kind":"Name","value":"Duration"}},{"kind":"Field","name":{"kind":"Name","value":"Format"}},{"kind":"Field","name":{"kind":"Name","value":"VideoCodec"}},{"kind":"Field","name":{"kind":"Name","value":"VideoCodecDescription"}},{"kind":"Field","name":{"kind":"Name","value":"Width"}},{"kind":"Field","name":{"kind":"Name","value":"Height"}},{"kind":"Field","name":{"kind":"Name","value":"Framerate"}},{"kind":"Field","name":{"kind":"Name","value":"AudioCodec"}},{"kind":"Field","name":{"kind":"Name","value":"AudioCodecDescription"}}]}}]}}]}}]} as unknown as DocumentNode<VideoMetadataFragmentFragment, unknown>;
export const ImageMetadataFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ImageMetadataFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Image"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Image"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"Camera"}},{"kind":"Field","name":{"kind":"Name","value":"Lens"}},{"kind":"Field","name":{"kind":"Name","value":"Artist"}},{"kind":"Field","name":{"kind":"Name","value":"DateTimeOriginal"}},{"kind":"Field","name":{"kind":"Name","value":"DateTimeEdit"}},{"kind":"Field","name":{"kind":"Name","value":"Aperture"}},{"kind":"Field","name":{"kind":"Name","value":"ExposureTime"}},{"kind":"Field","name":{"kind":"Name","value":"ISO"}},{"kind":"Field","name":{"kind":"Name","value":"Width"}},{"kind":"Field","name":{"kind":"Name","value":"Height"}},{"kind":"Field","name":{"kind":"Name","value":"Rating"}}]}}]}}]}}]} as unknown as DocumentNode<ImageMetadataFragmentFragment, unknown>;
export const FileFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileInterface"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"fileHash"}},{"kind":"Field","name":{"kind":"Name","value":"fileSize"}},{"kind":"Field","name":{"kind":"Name","value":"fileLastModified"}},{"kind":"Field","name":{"kind":"Name","value":"flag"}},{"kind":"Field","name":{"kind":"Name","value":"rating"}},{"kind":"Field","name":{"kind":"Name","value":"totalComments"}},{"kind":"Field","name":{"kind":"Name","value":"latestComment"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Video"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"imageRatio"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"VideoMetadataFragment"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Image"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"imageRatio"}},{"kind":"Field","name":{"kind":"Name","value":"blurHash"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ImageMetadataFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"VideoMetadataFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Video"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Video"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"Bitrate"}},{"kind":"Field","name":{"kind":"Name","value":"Duration"}},{"kind":"Field","name":{"kind":"Name","value":"Format"}},{"kind":"Field","name":{"kind":"Name","value":"VideoCodec"}},{"kind":"Field","name":{"kind":"Name","value":"VideoCodecDescription"}},{"kind":"Field","name":{"kind":"Name","value":"Width"}},{"kind":"Field","name":{"kind":"Name","value":"Height"}},{"kind":"Field","name":{"kind":"Name","value":"Framerate"}},{"kind":"Field","name":{"kind":"Name","value":"AudioCodec"}},{"kind":"Field","name":{"kind":"Name","value":"AudioCodecDescription"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ImageMetadataFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Image"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Image"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"Camera"}},{"kind":"Field","name":{"kind":"Name","value":"Lens"}},{"kind":"Field","name":{"kind":"Name","value":"Artist"}},{"kind":"Field","name":{"kind":"Name","value":"DateTimeOriginal"}},{"kind":"Field","name":{"kind":"Name","value":"DateTimeEdit"}},{"kind":"Field","name":{"kind":"Name","value":"Aperture"}},{"kind":"Field","name":{"kind":"Name","value":"ExposureTime"}},{"kind":"Field","name":{"kind":"Name","value":"ISO"}},{"kind":"Field","name":{"kind":"Name","value":"Width"}},{"kind":"Field","name":{"kind":"Name","value":"Height"}},{"kind":"Field","name":{"kind":"Name","value":"Rating"}}]}}]}}]}}]} as unknown as DocumentNode<FileFragmentFragment, unknown>;
export const HeroImageFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HeroImageFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"heroImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fileHash"}},{"kind":"Field","name":{"kind":"Name","value":"imageRatio"}},{"kind":"Field","name":{"kind":"Name","value":"blurHash"}}]}}]}}]} as unknown as DocumentNode<HeroImageFragmentFragment, unknown>;
export const FolderFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FolderFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"folderLastModified"}},{"kind":"Field","name":{"kind":"Name","value":"parents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"branding"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"primaryColor"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"folder"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"HeroImageFragment"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HeroImageFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"heroImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fileHash"}},{"kind":"Field","name":{"kind":"Name","value":"imageRatio"}},{"kind":"Field","name":{"kind":"Name","value":"blurHash"}}]}}]}}]} as unknown as DocumentNode<FolderFragmentFragment, unknown>;
export const MinimumFolderFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MinimumFolderFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"HeroImageFragment"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HeroImageFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"heroImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fileHash"}},{"kind":"Field","name":{"kind":"Name","value":"imageRatio"}},{"kind":"Field","name":{"kind":"Name","value":"blurHash"}}]}}]}}]} as unknown as DocumentNode<MinimumFolderFragmentFragment, unknown>;
export const TreeSizeFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TreeSizeFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"totalFiles"}},{"kind":"Field","name":{"kind":"Name","value":"totalFolders"}},{"kind":"Field","name":{"kind":"Name","value":"totalSize"}},{"kind":"Field","name":{"kind":"Name","value":"totalDirectSize"}}]}}]} as unknown as DocumentNode<TreeSizeFragmentFragment, unknown>;
export const UserFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"uuid"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"Field","name":{"kind":"Name","value":"commentPermissions"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}},{"kind":"Field","name":{"kind":"Name","value":"ntfy"}},{"kind":"Field","name":{"kind":"Name","value":"folder"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<UserFragmentFragment, unknown>;
export const DeleteBrandingMutationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteBrandingMutation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteBranding"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"folderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FolderFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HeroImageFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"heroImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fileHash"}},{"kind":"Field","name":{"kind":"Name","value":"imageRatio"}},{"kind":"Field","name":{"kind":"Name","value":"blurHash"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FolderFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"folderLastModified"}},{"kind":"Field","name":{"kind":"Name","value":"parents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"branding"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"primaryColor"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"folder"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"HeroImageFragment"}}]}}]} as unknown as DocumentNode<DeleteBrandingMutationMutation, DeleteBrandingMutationMutationVariables>;
export const TreeSizeQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TreeSizeQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"folder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TreeSizeFragment"}},{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"fileSize"}}]}},{"kind":"Field","name":{"kind":"Name","value":"subFolders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TreeSizeFragment"}},{"kind":"Field","name":{"kind":"Name","value":"subFolders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TreeSizeFragment"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TreeSizeFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"totalFiles"}},{"kind":"Field","name":{"kind":"Name","value":"totalFolders"}},{"kind":"Field","name":{"kind":"Name","value":"totalSize"}},{"kind":"Field","name":{"kind":"Name","value":"totalDirectSize"}}]}}]} as unknown as DocumentNode<TreeSizeQueryQuery, TreeSizeQueryQueryVariables>;
export const AddCommentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"addComment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"rating"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"flag"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"FileFlag"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"comment"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"nickName"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addComment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"rating"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rating"}}},{"kind":"Argument","name":{"kind":"Name","value":"flag"},"value":{"kind":"Variable","name":{"kind":"Name","value":"flag"}}},{"kind":"Argument","name":{"kind":"Name","value":"comment"},"value":{"kind":"Variable","name":{"kind":"Name","value":"comment"}}},{"kind":"Argument","name":{"kind":"Name","value":"nickName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"nickName"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"VideoMetadataFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Video"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Video"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"Bitrate"}},{"kind":"Field","name":{"kind":"Name","value":"Duration"}},{"kind":"Field","name":{"kind":"Name","value":"Format"}},{"kind":"Field","name":{"kind":"Name","value":"VideoCodec"}},{"kind":"Field","name":{"kind":"Name","value":"VideoCodecDescription"}},{"kind":"Field","name":{"kind":"Name","value":"Width"}},{"kind":"Field","name":{"kind":"Name","value":"Height"}},{"kind":"Field","name":{"kind":"Name","value":"Framerate"}},{"kind":"Field","name":{"kind":"Name","value":"AudioCodec"}},{"kind":"Field","name":{"kind":"Name","value":"AudioCodecDescription"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ImageMetadataFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Image"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Image"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"Camera"}},{"kind":"Field","name":{"kind":"Name","value":"Lens"}},{"kind":"Field","name":{"kind":"Name","value":"Artist"}},{"kind":"Field","name":{"kind":"Name","value":"DateTimeOriginal"}},{"kind":"Field","name":{"kind":"Name","value":"DateTimeEdit"}},{"kind":"Field","name":{"kind":"Name","value":"Aperture"}},{"kind":"Field","name":{"kind":"Name","value":"ExposureTime"}},{"kind":"Field","name":{"kind":"Name","value":"ISO"}},{"kind":"Field","name":{"kind":"Name","value":"Width"}},{"kind":"Field","name":{"kind":"Name","value":"Height"}},{"kind":"Field","name":{"kind":"Name","value":"Rating"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileInterface"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"fileHash"}},{"kind":"Field","name":{"kind":"Name","value":"fileSize"}},{"kind":"Field","name":{"kind":"Name","value":"fileLastModified"}},{"kind":"Field","name":{"kind":"Name","value":"flag"}},{"kind":"Field","name":{"kind":"Name","value":"rating"}},{"kind":"Field","name":{"kind":"Name","value":"totalComments"}},{"kind":"Field","name":{"kind":"Name","value":"latestComment"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Video"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"imageRatio"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"VideoMetadataFragment"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Image"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"imageRatio"}},{"kind":"Field","name":{"kind":"Name","value":"blurHash"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ImageMetadataFragment"}}]}}]}}]} as unknown as DocumentNode<AddCommentMutation, AddCommentMutationVariables>;
export const EditAdminUserMutationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EditAdminUserMutation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"username"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"password"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"commentPermissions"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"CommentPermissions"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ntfy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"editAdminUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"username"},"value":{"kind":"Variable","name":{"kind":"Name","value":"username"}}},{"kind":"Argument","name":{"kind":"Name","value":"password"},"value":{"kind":"Variable","name":{"kind":"Name","value":"password"}}},{"kind":"Argument","name":{"kind":"Name","value":"enabled"},"value":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}}},{"kind":"Argument","name":{"kind":"Name","value":"folderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}}},{"kind":"Argument","name":{"kind":"Name","value":"commentPermissions"},"value":{"kind":"Variable","name":{"kind":"Name","value":"commentPermissions"}}},{"kind":"Argument","name":{"kind":"Name","value":"ntfy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ntfy"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"uuid"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"Field","name":{"kind":"Name","value":"commentPermissions"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}},{"kind":"Field","name":{"kind":"Name","value":"ntfy"}},{"kind":"Field","name":{"kind":"Name","value":"folder"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<EditAdminUserMutationMutation, EditAdminUserMutationMutationVariables>;
export const EditFolderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"editFolder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"heroImageId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"editFolder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"folderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}}},{"kind":"Argument","name":{"kind":"Name","value":"heroImageId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"heroImageId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FolderFragment"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"HeroImageFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HeroImageFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"heroImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fileHash"}},{"kind":"Field","name":{"kind":"Name","value":"imageRatio"}},{"kind":"Field","name":{"kind":"Name","value":"blurHash"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FolderFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"folderLastModified"}},{"kind":"Field","name":{"kind":"Name","value":"parents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"branding"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"primaryColor"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"folder"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"HeroImageFragment"}}]}}]} as unknown as DocumentNode<EditFolderMutation, EditFolderMutationVariables>;
export const EditUserMutationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EditUserMutation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"username"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"uuid"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"commentPermissions"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"CommentPermissions"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"editUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"username"},"value":{"kind":"Variable","name":{"kind":"Name","value":"username"}}},{"kind":"Argument","name":{"kind":"Name","value":"uuid"},"value":{"kind":"Variable","name":{"kind":"Name","value":"uuid"}}},{"kind":"Argument","name":{"kind":"Name","value":"enabled"},"value":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}}},{"kind":"Argument","name":{"kind":"Name","value":"folderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}}},{"kind":"Argument","name":{"kind":"Name","value":"commentPermissions"},"value":{"kind":"Variable","name":{"kind":"Name","value":"commentPermissions"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"uuid"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"Field","name":{"kind":"Name","value":"commentPermissions"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}},{"kind":"Field","name":{"kind":"Name","value":"ntfy"}},{"kind":"Field","name":{"kind":"Name","value":"folder"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<EditUserMutationMutation, EditUserMutationMutationVariables>;
export const GenerateThumbnailsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"generateThumbnailsQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"generateThumbnails"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"folderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}}}]}]}}]} as unknown as DocumentNode<GenerateThumbnailsQueryMutation, GenerateThumbnailsQueryMutationVariables>;
export const GenerateZipDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GenerateZip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"generateZip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"folderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}}}]}]}}]} as unknown as DocumentNode<GenerateZipMutation, GenerateZipMutationVariables>;
export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"login"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"username"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"password"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"auth"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"user"},"value":{"kind":"Variable","name":{"kind":"Name","value":"username"}}},{"kind":"Argument","name":{"kind":"Name","value":"password"},"value":{"kind":"Variable","name":{"kind":"Name","value":"password"}}}]}]}}]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const AccessLogsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AccessLogsQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"includeChildren"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userType"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"UserType"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessLogs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"folderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}}},{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"includeChildren"},"value":{"kind":"Variable","name":{"kind":"Name","value":"includeChildren"}}},{"kind":"Argument","name":{"kind":"Name","value":"userType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userType"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"Field","name":{"kind":"Name","value":"ipAddress"}},{"kind":"Field","name":{"kind":"Name","value":"userAgent"}},{"kind":"Field","name":{"kind":"Name","value":"folder"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FolderFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HeroImageFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"heroImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fileHash"}},{"kind":"Field","name":{"kind":"Name","value":"imageRatio"}},{"kind":"Field","name":{"kind":"Name","value":"blurHash"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FolderFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"folderLastModified"}},{"kind":"Field","name":{"kind":"Name","value":"parents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"branding"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"primaryColor"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"folder"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"HeroImageFragment"}}]}}]} as unknown as DocumentNode<AccessLogsQueryQuery, AccessLogsQueryQueryVariables>;
export const CommentHistoryQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"commentHistoryQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fileId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"comments"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"fileId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fileId"}}},{"kind":"Argument","name":{"kind":"Name","value":"folderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}},{"kind":"Field","name":{"kind":"Name","value":"systemGenerated"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"file"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"VideoMetadataFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Video"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Video"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"Bitrate"}},{"kind":"Field","name":{"kind":"Name","value":"Duration"}},{"kind":"Field","name":{"kind":"Name","value":"Format"}},{"kind":"Field","name":{"kind":"Name","value":"VideoCodec"}},{"kind":"Field","name":{"kind":"Name","value":"VideoCodecDescription"}},{"kind":"Field","name":{"kind":"Name","value":"Width"}},{"kind":"Field","name":{"kind":"Name","value":"Height"}},{"kind":"Field","name":{"kind":"Name","value":"Framerate"}},{"kind":"Field","name":{"kind":"Name","value":"AudioCodec"}},{"kind":"Field","name":{"kind":"Name","value":"AudioCodecDescription"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ImageMetadataFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Image"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Image"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"Camera"}},{"kind":"Field","name":{"kind":"Name","value":"Lens"}},{"kind":"Field","name":{"kind":"Name","value":"Artist"}},{"kind":"Field","name":{"kind":"Name","value":"DateTimeOriginal"}},{"kind":"Field","name":{"kind":"Name","value":"DateTimeEdit"}},{"kind":"Field","name":{"kind":"Name","value":"Aperture"}},{"kind":"Field","name":{"kind":"Name","value":"ExposureTime"}},{"kind":"Field","name":{"kind":"Name","value":"ISO"}},{"kind":"Field","name":{"kind":"Name","value":"Width"}},{"kind":"Field","name":{"kind":"Name","value":"Height"}},{"kind":"Field","name":{"kind":"Name","value":"Rating"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileInterface"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"fileHash"}},{"kind":"Field","name":{"kind":"Name","value":"fileSize"}},{"kind":"Field","name":{"kind":"Name","value":"fileLastModified"}},{"kind":"Field","name":{"kind":"Name","value":"flag"}},{"kind":"Field","name":{"kind":"Name","value":"rating"}},{"kind":"Field","name":{"kind":"Name","value":"totalComments"}},{"kind":"Field","name":{"kind":"Name","value":"latestComment"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Video"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"imageRatio"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"VideoMetadataFragment"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Image"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"imageRatio"}},{"kind":"Field","name":{"kind":"Name","value":"blurHash"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ImageMetadataFragment"}}]}}]}}]} as unknown as DocumentNode<CommentHistoryQueryQuery, CommentHistoryQueryQueryVariables>;
export const GenerateThumbnailsStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"generateThumbnailsStats"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"folder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FolderFragment"}},{"kind":"Field","name":{"kind":"Name","value":"totalImages"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HeroImageFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"heroImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fileHash"}},{"kind":"Field","name":{"kind":"Name","value":"imageRatio"}},{"kind":"Field","name":{"kind":"Name","value":"blurHash"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FolderFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"folderLastModified"}},{"kind":"Field","name":{"kind":"Name","value":"parents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"branding"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"primaryColor"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"folder"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"HeroImageFragment"}}]}}]} as unknown as DocumentNode<GenerateThumbnailsStatsQuery, GenerateThumbnailsStatsQueryVariables>;
export const ManageFolderQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ManageFolderQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"includeParents"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"includeChildren"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"folder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FolderFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"users"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"folderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}}},{"kind":"Argument","name":{"kind":"Name","value":"includeParents"},"value":{"kind":"Variable","name":{"kind":"Name","value":"includeParents"}}},{"kind":"Argument","name":{"kind":"Name","value":"includeChildren"},"value":{"kind":"Variable","name":{"kind":"Name","value":"includeChildren"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFragment"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"Field","name":{"kind":"Name","value":"folder"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FolderFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HeroImageFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"heroImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fileHash"}},{"kind":"Field","name":{"kind":"Name","value":"imageRatio"}},{"kind":"Field","name":{"kind":"Name","value":"blurHash"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FolderFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"folderLastModified"}},{"kind":"Field","name":{"kind":"Name","value":"parents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"branding"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"primaryColor"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"folder"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"HeroImageFragment"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"uuid"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"Field","name":{"kind":"Name","value":"commentPermissions"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}},{"kind":"Field","name":{"kind":"Name","value":"ntfy"}},{"kind":"Field","name":{"kind":"Name","value":"folder"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<ManageFolderQueryQuery, ManageFolderQueryQueryVariables>;
export const MeQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MeQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userType"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"Field","name":{"kind":"Name","value":"uuid"}},{"kind":"Field","name":{"kind":"Name","value":"commentPermissions"}},{"kind":"Field","name":{"kind":"Name","value":"folder"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"clientInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"avifEnabled"}}]}}]}}]} as unknown as DocumentNode<MeQueryQuery, MeQueryQueryVariables>;
export const ReadAllFoldersQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"readAllFoldersQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sort"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"FoldersSortType"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allFolders"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"sort"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sort"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FolderFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HeroImageFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"heroImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fileHash"}},{"kind":"Field","name":{"kind":"Name","value":"imageRatio"}},{"kind":"Field","name":{"kind":"Name","value":"blurHash"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FolderFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"folderLastModified"}},{"kind":"Field","name":{"kind":"Name","value":"parents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"branding"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"primaryColor"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"folder"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"HeroImageFragment"}}]}}]} as unknown as DocumentNode<ReadAllFoldersQueryQuery, ReadAllFoldersQueryQueryVariables>;
export const RecentUsersQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RecentUsersQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"folderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}}},{"kind":"Argument","name":{"kind":"Name","value":"sortByRecent"},"value":{"kind":"BooleanValue","value":true}},{"kind":"Argument","name":{"kind":"Name","value":"includeChildren"},"value":{"kind":"BooleanValue","value":true}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"Field","name":{"kind":"Name","value":"lastAccess"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}},{"kind":"Field","name":{"kind":"Name","value":"folder"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"HeroImageFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HeroImageFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"heroImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fileHash"}},{"kind":"Field","name":{"kind":"Name","value":"imageRatio"}},{"kind":"Field","name":{"kind":"Name","value":"blurHash"}}]}}]}}]} as unknown as DocumentNode<RecentUsersQueryQuery, RecentUsersQueryQueryVariables>;
export const SearchQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"searchQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchFolders"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"folderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}}},{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FolderFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"searchFiles"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"folderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}}},{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileFragment"}},{"kind":"Field","name":{"kind":"Name","value":"folder"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MinimumFolderFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HeroImageFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"heroImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fileHash"}},{"kind":"Field","name":{"kind":"Name","value":"imageRatio"}},{"kind":"Field","name":{"kind":"Name","value":"blurHash"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"VideoMetadataFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Video"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Video"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"Bitrate"}},{"kind":"Field","name":{"kind":"Name","value":"Duration"}},{"kind":"Field","name":{"kind":"Name","value":"Format"}},{"kind":"Field","name":{"kind":"Name","value":"VideoCodec"}},{"kind":"Field","name":{"kind":"Name","value":"VideoCodecDescription"}},{"kind":"Field","name":{"kind":"Name","value":"Width"}},{"kind":"Field","name":{"kind":"Name","value":"Height"}},{"kind":"Field","name":{"kind":"Name","value":"Framerate"}},{"kind":"Field","name":{"kind":"Name","value":"AudioCodec"}},{"kind":"Field","name":{"kind":"Name","value":"AudioCodecDescription"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ImageMetadataFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Image"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Image"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"Camera"}},{"kind":"Field","name":{"kind":"Name","value":"Lens"}},{"kind":"Field","name":{"kind":"Name","value":"Artist"}},{"kind":"Field","name":{"kind":"Name","value":"DateTimeOriginal"}},{"kind":"Field","name":{"kind":"Name","value":"DateTimeEdit"}},{"kind":"Field","name":{"kind":"Name","value":"Aperture"}},{"kind":"Field","name":{"kind":"Name","value":"ExposureTime"}},{"kind":"Field","name":{"kind":"Name","value":"ISO"}},{"kind":"Field","name":{"kind":"Name","value":"Width"}},{"kind":"Field","name":{"kind":"Name","value":"Height"}},{"kind":"Field","name":{"kind":"Name","value":"Rating"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FolderFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"folderLastModified"}},{"kind":"Field","name":{"kind":"Name","value":"parents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"branding"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"primaryColor"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"folder"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"HeroImageFragment"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileInterface"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"fileHash"}},{"kind":"Field","name":{"kind":"Name","value":"fileSize"}},{"kind":"Field","name":{"kind":"Name","value":"fileLastModified"}},{"kind":"Field","name":{"kind":"Name","value":"flag"}},{"kind":"Field","name":{"kind":"Name","value":"rating"}},{"kind":"Field","name":{"kind":"Name","value":"totalComments"}},{"kind":"Field","name":{"kind":"Name","value":"latestComment"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Video"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"imageRatio"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"VideoMetadataFragment"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Image"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"imageRatio"}},{"kind":"Field","name":{"kind":"Name","value":"blurHash"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ImageMetadataFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MinimumFolderFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"HeroImageFragment"}}]}}]} as unknown as DocumentNode<SearchQueryQuery, SearchQueryQueryVariables>;
export const ServerInfoQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"serverInfoQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"latest"}},{"kind":"Field","name":{"kind":"Name","value":"databaseUrl"}},{"kind":"Field","name":{"kind":"Name","value":"dev"}},{"kind":"Field","name":{"kind":"Name","value":"usePolling"}},{"kind":"Field","name":{"kind":"Name","value":"host"}}]}}]}}]} as unknown as DocumentNode<ServerInfoQueryQuery, ServerInfoQueryQueryVariables>;
export const ExpensiveServerFileSizeQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"expensiveServerFileSizeQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cacheSize"}},{"kind":"Field","name":{"kind":"Name","value":"mediaSize"}}]}}]}}]} as unknown as DocumentNode<ExpensiveServerFileSizeQueryQuery, ExpensiveServerFileSizeQueryQueryVariables>;
export const TaskQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TaskQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tasks"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"folderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"step"}},{"kind":"Field","name":{"kind":"Name","value":"totalSteps"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<TaskQueryQuery, TaskQueryQueryVariables>;
export const ViewAdminsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ViewAdminsQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"admins"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"uuid"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"Field","name":{"kind":"Name","value":"commentPermissions"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}},{"kind":"Field","name":{"kind":"Name","value":"ntfy"}},{"kind":"Field","name":{"kind":"Name","value":"folder"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<ViewAdminsQueryQuery, ViewAdminsQueryQueryVariables>;
export const ViewBrandingsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ViewBrandingsQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"brandings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"primaryColor"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"Field","name":{"kind":"Name","value":"folder"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MinimumFolderFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HeroImageFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"heroImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fileHash"}},{"kind":"Field","name":{"kind":"Name","value":"imageRatio"}},{"kind":"Field","name":{"kind":"Name","value":"blurHash"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MinimumFolderFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"HeroImageFragment"}}]}}]} as unknown as DocumentNode<ViewBrandingsQueryQuery, ViewBrandingsQueryQueryVariables>;
export const ViewFileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ViewFile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fileId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"file"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fileId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileFragment"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ImageMetadataFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"VideoMetadataFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Video"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Video"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"Bitrate"}},{"kind":"Field","name":{"kind":"Name","value":"Duration"}},{"kind":"Field","name":{"kind":"Name","value":"Format"}},{"kind":"Field","name":{"kind":"Name","value":"VideoCodec"}},{"kind":"Field","name":{"kind":"Name","value":"VideoCodecDescription"}},{"kind":"Field","name":{"kind":"Name","value":"Width"}},{"kind":"Field","name":{"kind":"Name","value":"Height"}},{"kind":"Field","name":{"kind":"Name","value":"Framerate"}},{"kind":"Field","name":{"kind":"Name","value":"AudioCodec"}},{"kind":"Field","name":{"kind":"Name","value":"AudioCodecDescription"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ImageMetadataFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Image"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Image"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"Camera"}},{"kind":"Field","name":{"kind":"Name","value":"Lens"}},{"kind":"Field","name":{"kind":"Name","value":"Artist"}},{"kind":"Field","name":{"kind":"Name","value":"DateTimeOriginal"}},{"kind":"Field","name":{"kind":"Name","value":"DateTimeEdit"}},{"kind":"Field","name":{"kind":"Name","value":"Aperture"}},{"kind":"Field","name":{"kind":"Name","value":"ExposureTime"}},{"kind":"Field","name":{"kind":"Name","value":"ISO"}},{"kind":"Field","name":{"kind":"Name","value":"Width"}},{"kind":"Field","name":{"kind":"Name","value":"Height"}},{"kind":"Field","name":{"kind":"Name","value":"Rating"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileInterface"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"fileHash"}},{"kind":"Field","name":{"kind":"Name","value":"fileSize"}},{"kind":"Field","name":{"kind":"Name","value":"fileLastModified"}},{"kind":"Field","name":{"kind":"Name","value":"flag"}},{"kind":"Field","name":{"kind":"Name","value":"rating"}},{"kind":"Field","name":{"kind":"Name","value":"totalComments"}},{"kind":"Field","name":{"kind":"Name","value":"latestComment"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Video"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"imageRatio"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"VideoMetadataFragment"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Image"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"imageRatio"}},{"kind":"Field","name":{"kind":"Name","value":"blurHash"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ImageMetadataFragment"}}]}}]}}]} as unknown as DocumentNode<ViewFileQuery, ViewFileQueryVariables>;
export const ViewFolderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ViewFolder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"folder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FolderFragment"}},{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"subFolders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MinimumFolderFragment"}},{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"commentPermissions"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HeroImageFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"heroImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fileHash"}},{"kind":"Field","name":{"kind":"Name","value":"imageRatio"}},{"kind":"Field","name":{"kind":"Name","value":"blurHash"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"VideoMetadataFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Video"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Video"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"Bitrate"}},{"kind":"Field","name":{"kind":"Name","value":"Duration"}},{"kind":"Field","name":{"kind":"Name","value":"Format"}},{"kind":"Field","name":{"kind":"Name","value":"VideoCodec"}},{"kind":"Field","name":{"kind":"Name","value":"VideoCodecDescription"}},{"kind":"Field","name":{"kind":"Name","value":"Width"}},{"kind":"Field","name":{"kind":"Name","value":"Height"}},{"kind":"Field","name":{"kind":"Name","value":"Framerate"}},{"kind":"Field","name":{"kind":"Name","value":"AudioCodec"}},{"kind":"Field","name":{"kind":"Name","value":"AudioCodecDescription"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ImageMetadataFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Image"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Image"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"Camera"}},{"kind":"Field","name":{"kind":"Name","value":"Lens"}},{"kind":"Field","name":{"kind":"Name","value":"Artist"}},{"kind":"Field","name":{"kind":"Name","value":"DateTimeOriginal"}},{"kind":"Field","name":{"kind":"Name","value":"DateTimeEdit"}},{"kind":"Field","name":{"kind":"Name","value":"Aperture"}},{"kind":"Field","name":{"kind":"Name","value":"ExposureTime"}},{"kind":"Field","name":{"kind":"Name","value":"ISO"}},{"kind":"Field","name":{"kind":"Name","value":"Width"}},{"kind":"Field","name":{"kind":"Name","value":"Height"}},{"kind":"Field","name":{"kind":"Name","value":"Rating"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FolderFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"folderLastModified"}},{"kind":"Field","name":{"kind":"Name","value":"parents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"branding"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"primaryColor"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"folder"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"HeroImageFragment"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileInterface"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"fileHash"}},{"kind":"Field","name":{"kind":"Name","value":"fileSize"}},{"kind":"Field","name":{"kind":"Name","value":"fileLastModified"}},{"kind":"Field","name":{"kind":"Name","value":"flag"}},{"kind":"Field","name":{"kind":"Name","value":"rating"}},{"kind":"Field","name":{"kind":"Name","value":"totalComments"}},{"kind":"Field","name":{"kind":"Name","value":"latestComment"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Video"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"imageRatio"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"VideoMetadataFragment"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Image"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"imageRatio"}},{"kind":"Field","name":{"kind":"Name","value":"blurHash"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ImageMetadataFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MinimumFolderFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"HeroImageFragment"}}]}}]} as unknown as DocumentNode<ViewFolderQuery, ViewFolderQueryVariables>;
export const ViewUserQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ViewUserQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"uuid"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"Field","name":{"kind":"Name","value":"commentPermissions"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}},{"kind":"Field","name":{"kind":"Name","value":"ntfy"}},{"kind":"Field","name":{"kind":"Name","value":"folder"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<ViewUserQueryQuery, ViewUserQueryQueryVariables>;