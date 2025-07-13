import { gql } from '../../../frontend/src/helpers/gql';

export const editAdminUserMutation = gql(/* GraphQL */ `
  mutation EditAdminUserMutation(
    $id: ID
    $name: String
    $username: String
    $password: String
    $enabled: Boolean
    $folderId: ID
    $commentPermissions: CommentPermissions
    $ntfy: String
  ) {
    editAdminUser(
      id: $id
      name: $name
      username: $username
      password: $password
      enabled: $enabled
      folderId: $folderId
      commentPermissions: $commentPermissions
      ntfy: $ntfy
    ) {
      ...UserFragment
    }
  }
`);
