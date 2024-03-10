import { gql } from '../../helpers/gql';

export const editUserMutation = gql(/* GraphQL */ `
  mutation EditPublicLinkMutation(
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
