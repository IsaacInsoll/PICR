export const loginMutationText = /* GraphQL */ `
  mutation login($username: String!, $password: String!) {
    auth(user: $username, password: $password)
  }
`;

export const editUserMutationText = /* GraphQL */ `
  mutation EditUserMutation(
    $id: ID
    $name: String
    $username: String
    $uuid: String
    $enabled: Boolean
    $folderId: ID
    $commentPermissions: CommentPermissions
    $linkMode: LinkMode
  ) {
    editUser(
      id: $id
      name: $name
      username: $username
      uuid: $uuid
      enabled: $enabled
      folderId: $folderId
      commentPermissions: $commentPermissions
      linkMode: $linkMode
    ) {
      id
    }
  }
`;

export const deleteUserMutationText = /* GraphQL */ `
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;
