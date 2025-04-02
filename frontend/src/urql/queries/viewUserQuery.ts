import { gql } from '../../helpers/gql';

export const viewUserQuery = gql(/*GraphQL*/ `
    query ViewUserQuery($id: ID!) {
        user(id:$id) {
            ...UserFragment
            
        }
    }
`);
