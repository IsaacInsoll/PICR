import { gql } from '../gql';

export const deleteBrandingMutation = gql(/* GraphQL */ `
  mutation DeleteBrandingMutation($id: ID!) {
    deleteBranding(id: $id)
  }
`);
