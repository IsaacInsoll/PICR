import { gql } from '../../helpers/gql';

export const minimumFolderFragment = gql(/* GraphQL */ `
  fragment MinimumFolderFragment on Folder {
    id
    name
    parentId
  }
`);
