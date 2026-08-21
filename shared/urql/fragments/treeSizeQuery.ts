import { gql } from '../gql';

export const treeSizeQuery = gql(/* GraphQL */ `
  query TreeSizeQuery($folderId: ID!) {
    folder(id: $folderId) {
      parents {
        id
        name
        parentId
      }
      ...TreeSizeFragment
      files {
        id
        name
        type
        fileSize
      }
      subFolders {
        ...TreeSizeFragment
        subFolders {
          ...TreeSizeFragment
        }
      }
    }
  }
`);
