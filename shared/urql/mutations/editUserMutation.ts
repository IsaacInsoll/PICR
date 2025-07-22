import {gql} from "../gql";

export const editUserMutation = gql(/* GraphQL */ `
  mutation EditUserMutation(
    $id: ID
    $name: String
    $username: String
    $uuid: String
    $enabled: Boolean
    $folderId: ID
    $commentPermissions: CommentPermissions
  ) {
    editUser(
      id: $id
      name: $name
      username: $username
      uuid: $uuid
      enabled: $enabled
      folderId: $folderId
      commentPermissions: $commentPermissions
    ) {
      ...UserFragment
    }
  }
`);
