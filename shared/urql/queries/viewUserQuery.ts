import {gql} from "../gql";

export const viewUserQuery = gql(/*GraphQL*/ `
    query ViewUserQuery($id: ID!) {
        user(id:$id) {
            ...UserFragment
            
        }
    }
`);
