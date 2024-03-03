import { gql } from '../helpers/gql';

export const viewFolderQuery = gql(/*GraphQL*/ `
    query ViewFolder($folderId: ID!) {
        folder(id:$folderId) {
            id
            name
            parentId
            permissions
            files {
                ...FileFragment
                metadata {
                    ...MetadataFragment
                }
            }
            subFolders {
                id
                name
            }
        }
    }
`);
