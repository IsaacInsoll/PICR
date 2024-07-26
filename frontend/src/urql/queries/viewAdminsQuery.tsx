import { gql } from '../../helpers/gql';

export const viewAdminsQuery = gql(/*GraphQL*/ `
    query ViewAdminsQuery {
        admins {
            ...UserFragment
        }
    }
`);
