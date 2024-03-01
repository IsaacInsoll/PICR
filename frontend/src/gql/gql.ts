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
    "\n  mutation login($username: String!, $password: String!) {\n    auth(user: $username, password: $password)\n  }\n": types.LoginDocument,
    "\n    query ViewFolder($folderId: ID!) {\n        folder(id:$folderId) {\n            id\n            name\n            parentId\n            permissions\n            files {\n                id\n                name\n                imageRatio\n                fileHash\n            }\n            subFolders {\n                id\n                name\n            }\n        }\n    }\n": types.ViewFolderDocument,
    "\n    query ViewMinimumFolder($folderId: ID!) {\n        folder(id:$folderId) {\n            id\n            name\n            parentId\n        }\n    }\n": types.ViewMinimumFolderDocument,
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
export function graphql(source: "\n  mutation login($username: String!, $password: String!) {\n    auth(user: $username, password: $password)\n  }\n"): (typeof documents)["\n  mutation login($username: String!, $password: String!) {\n    auth(user: $username, password: $password)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query ViewFolder($folderId: ID!) {\n        folder(id:$folderId) {\n            id\n            name\n            parentId\n            permissions\n            files {\n                id\n                name\n                imageRatio\n                fileHash\n            }\n            subFolders {\n                id\n                name\n            }\n        }\n    }\n"): (typeof documents)["\n    query ViewFolder($folderId: ID!) {\n        folder(id:$folderId) {\n            id\n            name\n            parentId\n            permissions\n            files {\n                id\n                name\n                imageRatio\n                fileHash\n            }\n            subFolders {\n                id\n                name\n            }\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query ViewMinimumFolder($folderId: ID!) {\n        folder(id:$folderId) {\n            id\n            name\n            parentId\n        }\n    }\n"): (typeof documents)["\n    query ViewMinimumFolder($folderId: ID!) {\n        folder(id:$folderId) {\n            id\n            name\n            parentId\n        }\n    }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;