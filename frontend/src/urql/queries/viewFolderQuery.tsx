import { gql } from '../../helpers/gql';

export const viewFolderQuery = gql(/*GraphQL*/ `
    query ViewFolder($folderId: ID!) {
        folder(id:$folderId) {
            ...FolderFragment
            files {
                ...FileFragment
            }
            subFolders {
                ...MinimumFolderFragment
            }
        }
    }
`);
