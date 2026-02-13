import { gql } from '../gql';

export const treeSizeFragment = gql(/* GraphQL */ `
  fragment TreeSizeFragment on Folder {
    id
    name
    totalFiles
    totalFolders
    totalSize
    totalDirectSize
  }
`);
