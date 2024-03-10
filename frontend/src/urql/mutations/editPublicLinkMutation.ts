import { gql } from '../../helpers/gql';

export const editPublicLinkMutation = gql(/* GraphQL */ `
  mutation EditPublicLinkMutation(
    $id: ID
    $name: String
    $uuid: String
    $enabled: Boolean
    $folderId: ID
  ) {
    editPublicLink(
      id: $id
      name: $name
      uuid: $uuid
      enabled: $enabled
      folderId: $folderId
    ) {
      ...PublicLinkFragment
    }
  }
`);
