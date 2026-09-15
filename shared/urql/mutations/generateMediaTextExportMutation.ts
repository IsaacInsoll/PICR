import { gql } from '../gql';

export const generateMediaTextExportMutation = gql(/* GraphQL */ `
  mutation GenerateMediaTextExport(
    $input: MediaResultsSelectionInput!
    $format: MediaTextExportFormat!
    $excludeExtensions: Boolean!
  ) {
    generateMediaTextExport(
      input: $input
      format: $format
      excludeExtensions: $excludeExtensions
    ) {
      token
      count
      filename
    }
  }
`);
