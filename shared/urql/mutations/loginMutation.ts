import {gql} from "../gql.js";

export const loginMutation = gql(/* GraphQL */ `
  mutation login($username: String!, $password: String!) {
    auth(user: $username, password: $password)
  }
`);
