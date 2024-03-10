import { gql } from '../../helpers/gql';

export const viewMinimumFolderQuery = gql(/*GraphQL*/ `
    query ViewMinimumFolder($folderId: ID!) {
        folder(id:$folderId) {
            ...MinimumFolderFragment
        }
    }
`);
