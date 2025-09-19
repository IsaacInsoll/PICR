import { gql } from '../gql';

export const userDeviceQuery = gql(/* GraphQL */ `
  query UserDeviceQuery($userId: ID!, $token: String!) {
    userDevices(userId: $userId, notificationToken: $token) {
      userId
      enabled
      name
      notificationToken
    }
  }
`);
