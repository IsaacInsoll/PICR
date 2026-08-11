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
    $galleryPasscode: String
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
      galleryPasscode: $galleryPasscode
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

export const editBrandingMutationText = /* GraphQL */ `
  mutation EditBranding(
    $id: ID
    $name: String
    $galleryLayout: GalleryLayout
    $thumbnailSize: Int
    $thumbnailSpacing: Int
    $thumbnailBorderRadius: Int
  ) {
    editBranding(
      id: $id
      name: $name
      galleryLayout: $galleryLayout
      thumbnailSize: $thumbnailSize
      thumbnailSpacing: $thumbnailSpacing
      thumbnailBorderRadius: $thumbnailBorderRadius
    ) {
      id
    }
  }
`;

export const setFolderBrandingMutationText = /* GraphQL */ `
  mutation SetFolderBranding($folderId: ID!, $brandingId: ID) {
    setFolderBranding(folderId: $folderId, brandingId: $brandingId) {
      id
    }
  }
`;

export const deleteBrandingMutationText = /* GraphQL */ `
  mutation DeleteBranding($id: ID!) {
    deleteBranding(id: $id)
  }
`;
