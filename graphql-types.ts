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
  BigInt: { input: any; output: any; }
  DateTime: { input: any; output: any; }
};

export type Comment = {
  __typename?: 'Comment';
  comment?: Maybe<Scalars['String']['output']>;
  file?: Maybe<File>;
  id?: Maybe<Scalars['ID']['output']>;
  systemGenerated: Scalars['Boolean']['output'];
  timestamp: Scalars['DateTime']['output'];
  user?: Maybe<User>;
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
  files: Array<FileInterface>;
  heroImage?: Maybe<Image>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  parentId?: Maybe<Scalars['ID']['output']>;
  parents: Array<Folder>;
  permissions?: Maybe<FolderPermissions>;
  subFolders: Array<Folder>;
  totalFiles: Scalars['Int']['output'];
  totalFolders: Scalars['Int']['output'];
  totalImages: Scalars['Int']['output'];
  totalSize: Scalars['String']['output'];
};

export enum FolderPermissions {
  Admin = 'Admin',
  None = 'None',
  View = 'View'
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
  editAdminUser: User;
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


export type MutationEditAdminUserArgs = {
  commentPermissions?: InputMaybe<CommentPermissions>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  folderId?: InputMaybe<Scalars['ID']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
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
  uuid?: InputMaybe<Scalars['String']['input']>;
};


export type MutationGenerateThumbnailsArgs = {
  folderId?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationGenerateZipArgs = {
  folderId?: InputMaybe<Scalars['ID']['input']>;
};

export type Query = {
  __typename?: 'Query';
  admins: Array<User>;
  allFolders: Array<Maybe<Folder>>;
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


export type QueryAllFoldersArgs = {
  id: Scalars['ID']['input'];
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
};

export type ServerInfo = {
  __typename?: 'ServerInfo';
  cacheSize: Scalars['BigInt']['output'];
  databaseUrl: Scalars['String']['output'];
  dev: Scalars['Boolean']['output'];
  host: Scalars['String']['output'];
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

export type User = {
  __typename?: 'User';
  commentPermissions?: Maybe<CommentPermissions>;
  enabled?: Maybe<Scalars['Boolean']['output']>;
  folder?: Maybe<Folder>;
  folderId: Scalars['ID']['output'];
  id?: Maybe<Scalars['ID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  username?: Maybe<Scalars['String']['output']>;
  uuid?: Maybe<Scalars['String']['output']>;
};

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
