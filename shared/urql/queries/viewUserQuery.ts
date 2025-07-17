import {gql} from "../gql.js";

export const viewUserQuery = gql(/*GraphQL*/ `
    query ViewUserQuery($id: ID!) {
        user(id:$id) {
            ...UserFragment
            
        }
    }
`);
