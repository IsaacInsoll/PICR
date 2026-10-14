import { gql } from '../gql';

export const taskQuery = gql(/* GraphQL */ `
  query TaskQuery($folderId: ID!) {
    tasks(folderId: $folderId) {
      id
      name
      step
      totalSteps
      status
    }
  }
`);

// The web UI ships with its backend. Keep the app's original taskQuery free
// of newer fields so an app update can still query older PICR servers.
export const taskQueryWithErrors = gql(/* GraphQL */ `
  query TaskQueryWithErrors($folderId: ID!) {
    tasks(folderId: $folderId) {
      id
      name
      step
      totalSteps
      status
      errorCode
    }
  }
`);
