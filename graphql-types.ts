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
  baseUrl: Scalars['String']['output'];
  canWrite: Scalars['Boolean']['output'];
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
  fileCreated: Scalars['DateTime']['output'];
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
  fileCreated: Scalars['DateTime']['output'];
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
  relativePath: Scalars['String']['output'];
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
  fileCreated: Scalars['DateTime']['output'];
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
  editUserDevice: UserDevice;
  generateThumbnails: Scalars['Boolean']['output'];
  generateZip: Scalars['String']['output'];
  renameFolder: Folder;
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
  ntfyEmail?: InputMaybe<Scalars['Boolean']['input']>;
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


export type MutationEditUserDeviceArgs = {
  enabled: Scalars['Boolean']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  notificationToken: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationGenerateThumbnailsArgs = {
  folderId?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationGenerateZipArgs = {
  folderId?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationRenameFolderArgs = {
  folderId: Scalars['ID']['input'];
  newPath: Scalars['String']['input'];
  oldPath: Scalars['String']['input'];
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
  userDevices: Array<UserDevice>;
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


export type QueryUserDevicesArgs = {
  notificationToken?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
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
  canWrite: Scalars['Boolean']['output'];
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
  ntfyEmail?: Maybe<Scalars['Boolean']['output']>;
  userType?: Maybe<UserType>;
  username?: Maybe<Scalars['String']['output']>;
  uuid?: Maybe<Scalars['String']['output']>;
};

export type UserDevice = {
  __typename?: 'UserDevice';
  enabled: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  notificationToken?: Maybe<Scalars['String']['output']>;
  userId: Scalars['ID']['output'];
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
  fileCreated: Scalars['DateTime']['output'];
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
