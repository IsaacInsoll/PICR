import { gql } from '../../helpers/gql';

export const editUserMutation = gql(/* GraphQL */ `
  mutation EditUserMutation(
    $id: ID
    $name: String
    $uuid: String
    $enabled: Boolean
    $folderId: ID
  ) {
    editUser(
      id: $id
      name: $name
      uuid: $uuid
      enabled: $enabled
      folderId: $folderId
    ) {
      ...UserFragment
    }
  }
`);
export const editAdminUserMutation = gql(/* GraphQL */ `
  mutation EditAdminUserMutation(
    $id: ID
    $name: String
    $username: String
    $password: String
    $enabled: Boolean
    $folderId: ID
  ) {
    editAdminUser(
      id: $id
      name: $name
      username: $username
      password: $password
      enabled: $enabled
      folderId: $folderId
    ) {
      ...UserFragment
    }
  }
`);
