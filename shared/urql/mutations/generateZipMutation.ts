import {gql} from "../gql.js";

export const generateZipMutation = gql(/* GraphQL */ `
  mutation GenerateZip($folderId: ID!) {
    generateZip(folderId: $folderId)
  }
`);
