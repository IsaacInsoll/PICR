import { gql } from '../gql';

export const userDeviceQuery = gql(/* GraphQL */ `
  query UserDeviceQuery($userId: ID!) {
    userDevices(userId: $userId) {
      userId
      enabled
      name
      notificationToken
    }
  }
`);
