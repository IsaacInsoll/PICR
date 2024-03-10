import { gql } from '../../helpers/gql';

export const manageFolderQuery = gql(/*GraphQL*/ `
    query ManageFolderQuery($folderId: ID!) {
        folder(id: $folderId) {
            ...FolderFragment
        }
        users(folderId:$folderId, includeParents: true) {
           ...UserFragment
           folderId
            folder {
                ...MinimumFolderFragment
            }
        }
    }
`);
