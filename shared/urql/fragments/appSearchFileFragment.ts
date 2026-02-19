import { gql } from '../gql';

export const appSearchFileFragment = gql(/* GraphQL */ `
  fragment AppSearchFileFragment on FileInterface {
    ...FileFragment
    folder {
      ...MinimumFolderFragment
    }
  }
`);
