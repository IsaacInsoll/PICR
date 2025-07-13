import { gql } from '../../../frontend/src/helpers/gql';

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
