import { gql } from '../../helpers/gql';

export const editAdminUserMutation = gql(/* GraphQL */ `
  mutation EditAdminUserMutation(
    $id: ID
    $name: String
    $username: String
    $password: String
    $enabled: Boolean
    $folderId: ID
    $commentPermissions: CommentPermissions
  ) {
    editAdminUser(
      id: $id
      name: $name
      username: $username
      password: $password
      enabled: $enabled
      folderId: $folderId
      commentPermissions: $commentPermissions
    ) {
      ...UserFragment
    }
  }
`);
