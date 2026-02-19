import { gql } from '../gql';

export const appSearchFolderFragment = gql(/* GraphQL */ `
  fragment AppSearchFolderFragment on Folder {
    ...FolderFragment
  }
`);
