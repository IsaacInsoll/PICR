import {gql} from "../gql.js";

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
