import { gql } from '../gql.js';

export const deleteUserMutation = gql(`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`);
