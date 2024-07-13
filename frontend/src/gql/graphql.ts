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
};

export type File = {
  __typename?: 'File';
  fileHash: Scalars['String']['output'];
  fileSize: Scalars['Int']['output'];
  folderId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  imageRatio?: Maybe<Scalars['Float']['output']>;
  metadata?: Maybe<MetadataSummary>;
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
  files: Array<File>;
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
  file: File;
  folder: Folder;
  tasks: Array<Task>;
  user: User;
  users: Array<User>;
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
  uuid: Scalars['String']['output'];
};

export type TaskQueryQueryVariables = Exact<{
  folderId: Scalars['ID']['input'];
}>;


export type TaskQueryQuery = { __typename?: 'Query', tasks: Array<{ __typename?: 'Task', id?: string | null, name: string, step?: number | null, totalSteps?: number | null, status?: string | null }> };

export type GenerateThumbnailsQueryMutationVariables = Exact<{
  folderId: Scalars['ID']['input'];
}>;


export type GenerateThumbnailsQueryMutation = { __typename?: 'Mutation', generateThumbnails: boolean };

export type FileFragmentFragment = { __typename?: 'File', id: string, name: string, type: FileType, imageRatio?: number | null, fileHash: string, fileSize: number };

export type FolderFragmentFragment = { __typename?: 'Folder', id: string, name: string, parentId?: string | null, permissions?: FolderPermissions | null, parents: Array<{ __typename?: 'Folder', id: string, name: string }> };

export type MetadataFragmentFragment = { __typename?: 'MetadataSummary', Camera?: string | null, Lens?: string | null, Artist?: string | null, DateTimeOriginal?: string | null, DateTimeEdit?: string | null, Aperture?: number | null, ExposureTime?: number | null, ISO?: number | null };

export type MinimumFolderFragmentFragment = { __typename?: 'Folder', id: string, name: string, parentId?: string | null };

export type UserFragmentFragment = { __typename?: 'User', id: string, name: string, enabled: boolean, uuid: string, folderId: string, folder?: { __typename?: 'Folder', id: string, name: string } | null };

export type LoginMutationVariables = Exact<{
  username: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type LoginMutation = { __typename?: 'Mutation', auth: string };

export type EditPublicLinkMutationMutationVariables = Exact<{
  id?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['String']['input']>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  folderId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type EditPublicLinkMutationMutation = { __typename?: 'Mutation', editUser: { __typename?: 'User', id: string, name: string, enabled: boolean, uuid: string, folderId: string, folder?: { __typename?: 'Folder', id: string, name: string } | null } };

export type GenerateZipMutationVariables = Exact<{
  folderId: Scalars['ID']['input'];
}>;


export type GenerateZipMutation = { __typename?: 'Mutation', generateZip: string };

export type ManageFolderQueryQueryVariables = Exact<{
  folderId: Scalars['ID']['input'];
}>;


export type ManageFolderQueryQuery = { __typename?: 'Query', folder: { __typename?: 'Folder', totalFiles: number, totalFolders: number, totalImages: number, totalSize: string, id: string, name: string, parentId?: string | null, permissions?: FolderPermissions | null, parents: Array<{ __typename?: 'Folder', id: string, name: string }> }, users: Array<{ __typename?: 'User', folderId: string, id: string, name: string, enabled: boolean, uuid: string, folder?: { __typename?: 'Folder', id: string, name: string, parentId?: string | null } | null }> };

export type ViewFileQueryVariables = Exact<{
  fileId: Scalars['ID']['input'];
}>;


export type ViewFileQuery = { __typename?: 'Query', file: { __typename?: 'File', id: string, name: string, type: FileType, imageRatio?: number | null, fileHash: string, fileSize: number, metadata?: { __typename?: 'MetadataSummary', Camera?: string | null, Lens?: string | null, Artist?: string | null, DateTimeOriginal?: string | null, DateTimeEdit?: string | null, Aperture?: number | null, ExposureTime?: number | null, ISO?: number | null } | null } };

export type ViewFolderQueryVariables = Exact<{
  folderId: Scalars['ID']['input'];
}>;


export type ViewFolderQuery = { __typename?: 'Query', folder: { __typename?: 'Folder', id: string, name: string, parentId?: string | null, permissions?: FolderPermissions | null, files: Array<{ __typename?: 'File', id: string, name: string, type: FileType, imageRatio?: number | null, fileHash: string, fileSize: number, metadata?: { __typename?: 'MetadataSummary', Camera?: string | null, Lens?: string | null, Artist?: string | null, DateTimeOriginal?: string | null, DateTimeEdit?: string | null, Aperture?: number | null, ExposureTime?: number | null, ISO?: number | null } | null }>, subFolders: Array<{ __typename?: 'Folder', id: string, name: string, parentId?: string | null }>, parents: Array<{ __typename?: 'Folder', id: string, name: string }> } };

export type ViewUserQueryQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ViewUserQueryQuery = { __typename?: 'Query', user: { __typename?: 'User', id: string, name: string, enabled: boolean, uuid: string, folderId: string, folder?: { __typename?: 'Folder', id: string, name: string } | null } };

export const FileFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"File"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"imageRatio"}},{"kind":"Field","name":{"kind":"Name","value":"fileHash"}},{"kind":"Field","name":{"kind":"Name","value":"fileSize"}}]}}]} as unknown as DocumentNode<FileFragmentFragment, unknown>;
export const FolderFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FolderFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"parents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<FolderFragmentFragment, unknown>;
export const MetadataFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MetadataFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MetadataSummary"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"Camera"}},{"kind":"Field","name":{"kind":"Name","value":"Lens"}},{"kind":"Field","name":{"kind":"Name","value":"Artist"}},{"kind":"Field","name":{"kind":"Name","value":"DateTimeOriginal"}},{"kind":"Field","name":{"kind":"Name","value":"DateTimeEdit"}},{"kind":"Field","name":{"kind":"Name","value":"Aperture"}},{"kind":"Field","name":{"kind":"Name","value":"ExposureTime"}},{"kind":"Field","name":{"kind":"Name","value":"ISO"}}]}}]} as unknown as DocumentNode<MetadataFragmentFragment, unknown>;
export const MinimumFolderFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MinimumFolderFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}}]}}]} as unknown as DocumentNode<MinimumFolderFragmentFragment, unknown>;
export const UserFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"uuid"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"Field","name":{"kind":"Name","value":"folder"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<UserFragmentFragment, unknown>;
export const TaskQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TaskQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tasks"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"folderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"step"}},{"kind":"Field","name":{"kind":"Name","value":"totalSteps"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<TaskQueryQuery, TaskQueryQueryVariables>;
export const GenerateThumbnailsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"generateThumbnailsQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"generateThumbnails"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"folderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}}}]}]}}]} as unknown as DocumentNode<GenerateThumbnailsQueryMutation, GenerateThumbnailsQueryMutationVariables>;
export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"login"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"username"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"password"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"auth"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"user"},"value":{"kind":"Variable","name":{"kind":"Name","value":"username"}}},{"kind":"Argument","name":{"kind":"Name","value":"password"},"value":{"kind":"Variable","name":{"kind":"Name","value":"password"}}}]}]}}]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const EditPublicLinkMutationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EditPublicLinkMutation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"uuid"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"editUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"uuid"},"value":{"kind":"Variable","name":{"kind":"Name","value":"uuid"}}},{"kind":"Argument","name":{"kind":"Name","value":"enabled"},"value":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}}},{"kind":"Argument","name":{"kind":"Name","value":"folderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"uuid"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"Field","name":{"kind":"Name","value":"folder"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<EditPublicLinkMutationMutation, EditPublicLinkMutationMutationVariables>;
export const GenerateZipDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GenerateZip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"generateZip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"folderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}}}]}]}}]} as unknown as DocumentNode<GenerateZipMutation, GenerateZipMutationVariables>;
export const ManageFolderQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ManageFolderQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"folder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FolderFragment"}},{"kind":"Field","name":{"kind":"Name","value":"totalFiles"}},{"kind":"Field","name":{"kind":"Name","value":"totalFolders"}},{"kind":"Field","name":{"kind":"Name","value":"totalImages"}},{"kind":"Field","name":{"kind":"Name","value":"totalSize"}}]}},{"kind":"Field","name":{"kind":"Name","value":"users"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"folderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}}},{"kind":"Argument","name":{"kind":"Name","value":"includeParents"},"value":{"kind":"BooleanValue","value":true}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFragment"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"Field","name":{"kind":"Name","value":"folder"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MinimumFolderFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FolderFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"parents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"uuid"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"Field","name":{"kind":"Name","value":"folder"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MinimumFolderFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}}]}}]} as unknown as DocumentNode<ManageFolderQueryQuery, ManageFolderQueryQueryVariables>;
export const ViewFileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ViewFile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fileId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"file"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fileId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileFragment"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MetadataFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"File"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"imageRatio"}},{"kind":"Field","name":{"kind":"Name","value":"fileHash"}},{"kind":"Field","name":{"kind":"Name","value":"fileSize"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MetadataFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MetadataSummary"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"Camera"}},{"kind":"Field","name":{"kind":"Name","value":"Lens"}},{"kind":"Field","name":{"kind":"Name","value":"Artist"}},{"kind":"Field","name":{"kind":"Name","value":"DateTimeOriginal"}},{"kind":"Field","name":{"kind":"Name","value":"DateTimeEdit"}},{"kind":"Field","name":{"kind":"Name","value":"Aperture"}},{"kind":"Field","name":{"kind":"Name","value":"ExposureTime"}},{"kind":"Field","name":{"kind":"Name","value":"ISO"}}]}}]} as unknown as DocumentNode<ViewFileQuery, ViewFileQueryVariables>;
export const ViewFolderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ViewFolder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"folder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FolderFragment"}},{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileFragment"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MetadataFragment"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"subFolders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MinimumFolderFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FolderFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"parents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"File"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"imageRatio"}},{"kind":"Field","name":{"kind":"Name","value":"fileHash"}},{"kind":"Field","name":{"kind":"Name","value":"fileSize"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MetadataFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MetadataSummary"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"Camera"}},{"kind":"Field","name":{"kind":"Name","value":"Lens"}},{"kind":"Field","name":{"kind":"Name","value":"Artist"}},{"kind":"Field","name":{"kind":"Name","value":"DateTimeOriginal"}},{"kind":"Field","name":{"kind":"Name","value":"DateTimeEdit"}},{"kind":"Field","name":{"kind":"Name","value":"Aperture"}},{"kind":"Field","name":{"kind":"Name","value":"ExposureTime"}},{"kind":"Field","name":{"kind":"Name","value":"ISO"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MinimumFolderFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Folder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}}]}}]} as unknown as DocumentNode<ViewFolderQuery, ViewFolderQueryVariables>;
export const ViewUserQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ViewUserQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"uuid"}},{"kind":"Field","name":{"kind":"Name","value":"folderId"}},{"kind":"Field","name":{"kind":"Name","value":"folder"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ViewUserQueryQuery, ViewUserQueryQueryVariables>;