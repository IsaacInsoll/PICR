import { gql } from '../helpers/gql';

export const viewFolderQuery = gql(/*GraphQL*/ `
    query ViewFolder($folderId: ID!) {
        folder(id:$folderId) {
            id
            name
            parentId
            permissions
            files {
                id
                name
                imageRatio
                fileHash
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
