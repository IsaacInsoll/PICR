import { gql } from '../gql';

//Literally same as `sharedFolderFragment` but I added `username` and `folder.parents`
export const viewAdminsQuery = gql(/*GraphQL*/ `
    query ViewAdminsQuery {
        admins {
            ...UserFragment
        }
    }
`);
