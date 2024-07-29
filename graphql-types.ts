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
};

export type File = FileInterface & {
  __typename?: 'File';
  fileHash: Scalars['String']['output'];
  fileSize: Scalars['BigInt']['output'];
  folderId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  type: FileType;
};

export type FileInterface = {
  fileHash: Scalars['String']['output'];
  fileSize: Scalars['BigInt']['output'];
  folderId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
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
  fileHash: Scalars['String']['output'];
  fileSize: Scalars['BigInt']['output'];
  folderId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  imageRatio?: Maybe<Scalars['Float']['output']>;
  metadata?: Maybe<MetadataSummary>;
  name: Scalars['String']['output'];
  type: FileType;
};

export type MetadataSummary = {
  __typename?: 'MetadataSummary';
  Aperture?: Maybe<Scalars['Float']['output']>;
  Artist?: Maybe<Scalars['String']['output']>;
  Camera?: Maybe<Scalars['String']['output']>;
  DateTimeEdit?: Maybe<Scalars['String']['output']>;
  DateTimeOriginal?: Maybe<Scalars['String']['output']>;
  ExposureTime?: Maybe<Scalars['Float']['output']>;
  ISO?: Maybe<Scalars['Float']['output']>;
  Lens?: Maybe<Scalars['String']['output']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  auth: Scalars['String']['output'];
  editUser: User;
  generateThumbnails: Scalars['Boolean']['output'];
  generateZip: Scalars['String']['output'];
};


export type MutationAuthArgs = {
  password: Scalars['String']['input'];
  user: Scalars['String']['input'];
};


export type MutationEditUserArgs = {
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
  file: FileInterface;
  folder: Folder;
  tasks: Array<Task>;
  user: User;
  users: Array<User>;
};


export type QueryAllFoldersArgs = {
  id: Scalars['ID']['input'];
};


export type QueryFileArgs = {
  id: Scalars['ID']['input'];
};


export type QueryFolderArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTasksArgs = {
  folderId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUsersArgs = {
  folderId: Scalars['ID']['input'];
  includeParents?: InputMaybe<Scalars['Boolean']['input']>;
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
  enabled: Scalars['Boolean']['output'];
  folder?: Maybe<Folder>;
  folderId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  username?: Maybe<Scalars['String']['output']>;
  uuid?: Maybe<Scalars['String']['output']>;
};

export type Video = FileInterface & {
  __typename?: 'Video';
  duration?: Maybe<Scalars['Float']['output']>;
  fileHash: Scalars['String']['output'];
  fileSize: Scalars['BigInt']['output'];
  folderId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  imageRatio?: Maybe<Scalars['Float']['output']>;
  metadata?: Maybe<MetadataSummary>;
  name: Scalars['String']['output'];
  type: FileType;
};
