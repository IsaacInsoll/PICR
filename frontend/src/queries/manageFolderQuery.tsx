import { gql } from '../helpers/gql';

export const manageFolderQuery = gql(/*GraphQL*/ `
    query ManageFolderQuery($folderId: ID!) {
        folder(id: $folderId) {
            id
            name
        }
        publicLinks(folderId:$folderId, includeParents: true) {
           ...PublicLinkFragment
           folderId
            folder {
                id
                name
            }
        }
    }
`);
