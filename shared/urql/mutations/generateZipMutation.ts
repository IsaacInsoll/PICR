import { gql } from '../../../frontend/src/helpers/gql';

export const generateZipMutation = gql(/* GraphQL */ `
  mutation GenerateZip($folderId: ID!) {
    generateZip(folderId: $folderId)
  }
`);
