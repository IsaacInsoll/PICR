import { gql } from '../gql';

export const viewFolderQuery = gql(/*GraphQL*/ `
    query ViewFolder($folderId: ID!) {
        folder(id:$folderId) {
            ...FolderFragment
            files {
                ...FileFragment
            }
            subFolders {
                ...MinimumFolderFragment
                users {
                    id
                    name
                    enabled
                    commentPermissions
                    gravatar
                }
            }
        }
    }
`);
