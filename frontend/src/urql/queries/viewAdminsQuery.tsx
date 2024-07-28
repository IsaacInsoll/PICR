import { gql } from '../../helpers/gql';

//Literally same as `sharedFolderFragment` but I added `username` and `folder.parents`
export const viewAdminsQuery = gql(/*GraphQL*/ `
    query ViewAdminsQuery {
        admins {
            username
            id
            name
            enabled
            uuid
            folderId
            folder {
                id
                name
                parents {
                    id
                    name
                }
            }
        }
    }
`);
