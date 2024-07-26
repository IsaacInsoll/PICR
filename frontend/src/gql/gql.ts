/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 */
const documents = {
    "\n  fragment FileFragment on FileInterface {\n    __typename\n    id\n    name\n    type\n    fileHash\n    fileSize\n    ... on Video {\n      imageRatio\n      duration\n    }\n    ... on Image {\n      imageRatio\n      ...ImageMetadataFragment\n    }\n  }\n": types.FileFragmentFragmentDoc,
    "\n  fragment FolderFragment on Folder {\n    id\n    name\n    parentId\n    permissions\n    parents {\n      id\n      name\n    }\n  }\n": types.FolderFragmentFragmentDoc,
    "\n  fragment ImageMetadataFragment on Image {\n    ... on Image {\n      metadata {\n        Camera\n        Lens\n        Artist\n        DateTimeOriginal\n        DateTimeEdit\n        Aperture\n        ExposureTime\n        ISO\n      }\n    }\n  }\n": types.ImageMetadataFragmentFragmentDoc,
    "\n  fragment MinimumFolderFragment on Folder {\n    id\n    name\n    parentId\n  }\n": types.MinimumFolderFragmentFragmentDoc,
    "\n  fragment UserFragment on User {\n    id\n    name\n    enabled\n    uuid\n    folderId\n    folder {\n      id\n      name\n    }\n  }\n": types.UserFragmentFragmentDoc,
    "\n  mutation login($username: String!, $password: String!) {\n    auth(user: $username, password: $password)\n  }\n": types.LoginDocument,
    "\n  mutation EditPublicLinkMutation(\n    $id: ID\n    $name: String\n    $uuid: String\n    $enabled: Boolean\n    $folderId: ID\n  ) {\n    editUser(\n      id: $id\n      name: $name\n      uuid: $uuid\n      enabled: $enabled\n      folderId: $folderId\n    ) {\n      ...UserFragment\n    }\n  }\n": types.EditPublicLinkMutationDocument,
    "\n    mutation generateThumbnailsQuery($folderId: ID!) {\n        generateThumbnails(folderId: $folderId)\n    }": types.GenerateThumbnailsQueryDocument,
    "\n  mutation GenerateZip($folderId: ID!) {\n    generateZip(folderId: $folderId)\n  }\n": types.GenerateZipDocument,
    "\n    query ManageFolderQuery($folderId: ID!) {\n        folder(id: $folderId) {\n            ...FolderFragment\n            totalFiles\n            totalFolders\n            totalImages\n            totalSize\n        }\n        users(folderId:$folderId, includeParents: true) {\n           ...UserFragment\n           folderId\n            folder {\n                ...MinimumFolderFragment\n            }\n        }\n    }\n": types.ManageFolderQueryDocument,
    "\n  query TaskQuery($folderId: ID!) {\n    tasks(folderId: $folderId) {\n      id\n      name\n      step\n      totalSteps\n      status\n    }\n  }\n": types.TaskQueryDocument,
    "\n    query ViewAdminsQuery {\n        admins {\n            ...UserFragment\n        }\n    }\n": types.ViewAdminsQueryDocument,
    "\n    query ViewFile($fileId: ID!) {\n        file(id:$fileId) {\n            ...FileFragment\n            ...ImageMetadataFragment\n        }\n    }\n": types.ViewFileDocument,
    "\n    query ViewFolder($folderId: ID!) {\n        folder(id:$folderId) {\n            ...FolderFragment\n            files {\n                ...FileFragment\n            }\n            subFolders {\n                ...MinimumFolderFragment\n            }\n        }\n    }\n": types.ViewFolderDocument,
    "\n    query ViewUserQuery($id: ID!) {\n        user(id:$id) {\n            ...UserFragment\n            \n        }\n    }\n": types.ViewUserQueryDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment FileFragment on FileInterface {\n    __typename\n    id\n    name\n    type\n    fileHash\n    fileSize\n    ... on Video {\n      imageRatio\n      duration\n    }\n    ... on Image {\n      imageRatio\n      ...ImageMetadataFragment\n    }\n  }\n"): (typeof documents)["\n  fragment FileFragment on FileInterface {\n    __typename\n    id\n    name\n    type\n    fileHash\n    fileSize\n    ... on Video {\n      imageRatio\n      duration\n    }\n    ... on Image {\n      imageRatio\n      ...ImageMetadataFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment FolderFragment on Folder {\n    id\n    name\n    parentId\n    permissions\n    parents {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  fragment FolderFragment on Folder {\n    id\n    name\n    parentId\n    permissions\n    parents {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ImageMetadataFragment on Image {\n    ... on Image {\n      metadata {\n        Camera\n        Lens\n        Artist\n        DateTimeOriginal\n        DateTimeEdit\n        Aperture\n        ExposureTime\n        ISO\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment ImageMetadataFragment on Image {\n    ... on Image {\n      metadata {\n        Camera\n        Lens\n        Artist\n        DateTimeOriginal\n        DateTimeEdit\n        Aperture\n        ExposureTime\n        ISO\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment MinimumFolderFragment on Folder {\n    id\n    name\n    parentId\n  }\n"): (typeof documents)["\n  fragment MinimumFolderFragment on Folder {\n    id\n    name\n    parentId\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment UserFragment on User {\n    id\n    name\n    enabled\n    uuid\n    folderId\n    folder {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  fragment UserFragment on User {\n    id\n    name\n    enabled\n    uuid\n    folderId\n    folder {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation login($username: String!, $password: String!) {\n    auth(user: $username, password: $password)\n  }\n"): (typeof documents)["\n  mutation login($username: String!, $password: String!) {\n    auth(user: $username, password: $password)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation EditPublicLinkMutation(\n    $id: ID\n    $name: String\n    $uuid: String\n    $enabled: Boolean\n    $folderId: ID\n  ) {\n    editUser(\n      id: $id\n      name: $name\n      uuid: $uuid\n      enabled: $enabled\n      folderId: $folderId\n    ) {\n      ...UserFragment\n    }\n  }\n"): (typeof documents)["\n  mutation EditPublicLinkMutation(\n    $id: ID\n    $name: String\n    $uuid: String\n    $enabled: Boolean\n    $folderId: ID\n  ) {\n    editUser(\n      id: $id\n      name: $name\n      uuid: $uuid\n      enabled: $enabled\n      folderId: $folderId\n    ) {\n      ...UserFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    mutation generateThumbnailsQuery($folderId: ID!) {\n        generateThumbnails(folderId: $folderId)\n    }"): (typeof documents)["\n    mutation generateThumbnailsQuery($folderId: ID!) {\n        generateThumbnails(folderId: $folderId)\n    }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation GenerateZip($folderId: ID!) {\n    generateZip(folderId: $folderId)\n  }\n"): (typeof documents)["\n  mutation GenerateZip($folderId: ID!) {\n    generateZip(folderId: $folderId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query ManageFolderQuery($folderId: ID!) {\n        folder(id: $folderId) {\n            ...FolderFragment\n            totalFiles\n            totalFolders\n            totalImages\n            totalSize\n        }\n        users(folderId:$folderId, includeParents: true) {\n           ...UserFragment\n           folderId\n            folder {\n                ...MinimumFolderFragment\n            }\n        }\n    }\n"): (typeof documents)["\n    query ManageFolderQuery($folderId: ID!) {\n        folder(id: $folderId) {\n            ...FolderFragment\n            totalFiles\n            totalFolders\n            totalImages\n            totalSize\n        }\n        users(folderId:$folderId, includeParents: true) {\n           ...UserFragment\n           folderId\n            folder {\n                ...MinimumFolderFragment\n            }\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TaskQuery($folderId: ID!) {\n    tasks(folderId: $folderId) {\n      id\n      name\n      step\n      totalSteps\n      status\n    }\n  }\n"): (typeof documents)["\n  query TaskQuery($folderId: ID!) {\n    tasks(folderId: $folderId) {\n      id\n      name\n      step\n      totalSteps\n      status\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query ViewAdminsQuery {\n        admins {\n            ...UserFragment\n        }\n    }\n"): (typeof documents)["\n    query ViewAdminsQuery {\n        admins {\n            ...UserFragment\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query ViewFile($fileId: ID!) {\n        file(id:$fileId) {\n            ...FileFragment\n            ...ImageMetadataFragment\n        }\n    }\n"): (typeof documents)["\n    query ViewFile($fileId: ID!) {\n        file(id:$fileId) {\n            ...FileFragment\n            ...ImageMetadataFragment\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query ViewFolder($folderId: ID!) {\n        folder(id:$folderId) {\n            ...FolderFragment\n            files {\n                ...FileFragment\n            }\n            subFolders {\n                ...MinimumFolderFragment\n            }\n        }\n    }\n"): (typeof documents)["\n    query ViewFolder($folderId: ID!) {\n        folder(id:$folderId) {\n            ...FolderFragment\n            files {\n                ...FileFragment\n            }\n            subFolders {\n                ...MinimumFolderFragment\n            }\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query ViewUserQuery($id: ID!) {\n        user(id:$id) {\n            ...UserFragment\n            \n        }\n    }\n"): (typeof documents)["\n    query ViewUserQuery($id: ID!) {\n        user(id:$id) {\n            ...UserFragment\n            \n        }\n    }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;