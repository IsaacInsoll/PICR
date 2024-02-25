import { gql } from './gql';

export const viewFolderQuery = gql(/*GraphQL*/ `
    query ViewFolder($folderId: ID!) {
        folder(id:$folderId) {
            id
            name
            parentId
            files {
                id
                name
                imageRatio
            }
            subFolders {
                id
                name
            }
        }
    }
`);

export const viewMinimumFolderQuery = gql(/*GraphQL*/ `
    query ViewMinimumFolder($folderId: ID!) {
        folder(id:$folderId) {
            id
            name
            parentId
        }
    }
`);
