import { gql } from '../../helpers/gql';

export const folderFragment = gql(/* GraphQL */ `
  fragment FolderFragment on Folder {
    id
    name
    parentId
    permissions
    parent {
      id
      name
    }
  }
`);
