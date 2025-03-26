import { gql } from '../../helpers/gql';

export const manageFolderQuery = gql(/*GraphQL*/ `
    query ManageFolderQuery($folderId: ID!, $includeParents: Boolean!, $includeChildren: Boolean!) {
        folder(id: $folderId) {
            ...FolderFragment
        }
        users(folderId:$folderId, includeParents: $includeParents, includeChildren: $includeChildren) {
           ...UserFragment
           folderId
            folder {
                ...FolderFragment
            }
        }
    }
`);
