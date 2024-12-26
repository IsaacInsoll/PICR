import { gql } from '../../helpers/gql';

//Literally same as `sharedFolderFragment` but I added `username` and `folder.parents`
export const viewBrandingsQuery = gql(/*GraphQL*/ `
    query ViewBrandingsQuery {
        brandings {
            id
            logoUrl
            primaryColor
            mode
            folderId
            folder {
               ...MinimumFolderFragment
            }
        }
    }
`);
