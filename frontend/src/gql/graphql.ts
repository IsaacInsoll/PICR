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
  folderId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  imageRatio?: Maybe<Scalars['Float']['output']>;
  metadata?: Maybe<MetadataSummary>;
  name: Scalars['String']['output'];
};

export type Folder = {
  __typename?: 'Folder';
  files: Array<File>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  parentId?: Maybe<Scalars['ID']['output']>;
  permissions?: Maybe<FolderPermissions>;
  subFolders: Array<Folder>;
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
};


export type MutationAuthArgs = {
  password: Scalars['String']['input'];
  user: Scalars['String']['input'];
};

export type Query = {
  __typename?: 'Query';
  file: File;
  folder: Folder;
};


export type QueryFileArgs = {
  id: Scalars['ID']['input'];
};


export type QueryFolderArgs = {
  id: Scalars['ID']['input'];
};

export type LoginMutationVariables = Exact<{
  username: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type LoginMutation = { __typename?: 'Mutation', auth: string };

export type FileFragmentFragment = { __typename?: 'File', id: string, name: string, imageRatio?: number | null, fileHash: string };

export type MetadataFragmentFragment = { __typename?: 'MetadataSummary', Camera?: string | null, Lens?: string | null, Artist?: string | null, DateTimeOriginal?: string | null, DateTimeEdit?: string | null, Aperture?: number | null, ExposureTime?: number | null, ISO?: number | null };

export type ViewFileQueryVariables = Exact<{
  fileId: Scalars['ID']['input'];
}>;


export type ViewFileQuery = { __typename?: 'Query', file: { __typename?: 'File', id: string, name: string, imageRatio?: number | null, fileHash: string, metadata?: { __typename?: 'MetadataSummary', Camera?: string | null, Lens?: string | null, Artist?: string | null, DateTimeOriginal?: string | null, DateTimeEdit?: string | null, Aperture?: number | null, ExposureTime?: number | null, ISO?: number | null } | null } };

export type ViewFolderQueryVariables = Exact<{
  folderId: Scalars['ID']['input'];
}>;


export type ViewFolderQuery = { __typename?: 'Query', folder: { __typename?: 'Folder', id: string, name: string, parentId?: string | null, permissions?: FolderPermissions | null, files: Array<{ __typename?: 'File', id: string, name: string, imageRatio?: number | null, fileHash: string, metadata?: { __typename?: 'MetadataSummary', Camera?: string | null, Lens?: string | null, Artist?: string | null, DateTimeOriginal?: string | null, DateTimeEdit?: string | null, Aperture?: number | null, ExposureTime?: number | null, ISO?: number | null } | null }>, subFolders: Array<{ __typename?: 'Folder', id: string, name: string }> } };

export type ViewMinimumFolderQueryVariables = Exact<{
  folderId: Scalars['ID']['input'];
}>;


export type ViewMinimumFolderQuery = { __typename?: 'Query', folder: { __typename?: 'Folder', id: string, name: string, parentId?: string | null } };

export const FileFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"File"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"imageRatio"}},{"kind":"Field","name":{"kind":"Name","value":"fileHash"}}]}}]} as unknown as DocumentNode<FileFragmentFragment, unknown>;
export const MetadataFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MetadataFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MetadataSummary"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"Camera"}},{"kind":"Field","name":{"kind":"Name","value":"Lens"}},{"kind":"Field","name":{"kind":"Name","value":"Artist"}},{"kind":"Field","name":{"kind":"Name","value":"DateTimeOriginal"}},{"kind":"Field","name":{"kind":"Name","value":"DateTimeEdit"}},{"kind":"Field","name":{"kind":"Name","value":"Aperture"}},{"kind":"Field","name":{"kind":"Name","value":"ExposureTime"}},{"kind":"Field","name":{"kind":"Name","value":"ISO"}}]}}]} as unknown as DocumentNode<MetadataFragmentFragment, unknown>;
export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"login"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"username"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"password"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"auth"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"user"},"value":{"kind":"Variable","name":{"kind":"Name","value":"username"}}},{"kind":"Argument","name":{"kind":"Name","value":"password"},"value":{"kind":"Variable","name":{"kind":"Name","value":"password"}}}]}]}}]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const ViewFileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ViewFile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fileId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"file"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fileId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileFragment"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MetadataFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"File"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"imageRatio"}},{"kind":"Field","name":{"kind":"Name","value":"fileHash"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MetadataFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MetadataSummary"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"Camera"}},{"kind":"Field","name":{"kind":"Name","value":"Lens"}},{"kind":"Field","name":{"kind":"Name","value":"Artist"}},{"kind":"Field","name":{"kind":"Name","value":"DateTimeOriginal"}},{"kind":"Field","name":{"kind":"Name","value":"DateTimeEdit"}},{"kind":"Field","name":{"kind":"Name","value":"Aperture"}},{"kind":"Field","name":{"kind":"Name","value":"ExposureTime"}},{"kind":"Field","name":{"kind":"Name","value":"ISO"}}]}}]} as unknown as DocumentNode<ViewFileQuery, ViewFileQueryVariables>;
export const ViewFolderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ViewFolder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"folder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileFragment"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MetadataFragment"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"subFolders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"File"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"imageRatio"}},{"kind":"Field","name":{"kind":"Name","value":"fileHash"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MetadataFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MetadataSummary"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"Camera"}},{"kind":"Field","name":{"kind":"Name","value":"Lens"}},{"kind":"Field","name":{"kind":"Name","value":"Artist"}},{"kind":"Field","name":{"kind":"Name","value":"DateTimeOriginal"}},{"kind":"Field","name":{"kind":"Name","value":"DateTimeEdit"}},{"kind":"Field","name":{"kind":"Name","value":"Aperture"}},{"kind":"Field","name":{"kind":"Name","value":"ExposureTime"}},{"kind":"Field","name":{"kind":"Name","value":"ISO"}}]}}]} as unknown as DocumentNode<ViewFolderQuery, ViewFolderQueryVariables>;
export const ViewMinimumFolderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ViewMinimumFolder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"folder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}}]}}]}}]} as unknown as DocumentNode<ViewMinimumFolderQuery, ViewMinimumFolderQueryVariables>;