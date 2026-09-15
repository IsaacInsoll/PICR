import { gql } from '../gql';

export const generateMediaResultsZipMutation = gql(/* GraphQL */ `
  mutation GenerateMediaResultsZip($input: MediaResultsSelectionInput!) {
    generateMediaResultsZip(input: $input) {
      token
      count
      filename
    }
  }
`);
