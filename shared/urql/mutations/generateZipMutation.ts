import { gql } from '../gql';

export const generateZipMutation = gql(/* GraphQL */ `
  mutation GenerateZip($folderId: ID!) {
    generateZip(folderId: $folderId)
  }
`);
