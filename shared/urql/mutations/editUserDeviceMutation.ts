import { gql } from '../gql';

export const editUserDeviceMutation = gql(/* GraphQL */ `
  mutation EditUserDeviceMutation(
    $token: String!
    $name: String!
    $userId: ID!
    $enabled: Boolean!
  ) {
    editUserDevice(
      notificationToken: $token
      userId: $userId
      enabled: $enabled
      name: $name
    ) {
      userId
      enabled
      name
      notificationToken
    }
  }
`);
