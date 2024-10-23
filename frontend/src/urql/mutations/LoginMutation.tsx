import { gql } from '../../helpers/gql';

export const loginMutationRaw = /* GraphQL */ `
  mutation login($username: String!, $password: String!) {
    auth(user: $username, password: $password)
  }
`;
export const loginMutation = gql(loginMutationRaw);
