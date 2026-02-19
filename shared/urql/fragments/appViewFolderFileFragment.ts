import { gql } from '../gql';

export const appViewFolderFileFragment = gql(/* GraphQL */ `
  fragment AppViewFolderFileFragment on FileInterface {
    ...FileFragment
  }
`);
