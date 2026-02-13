import { gql } from '../gql';

export const folderFilesQuery = gql(/* GraphQL */ `
  query FolderFiles($folderId: ID!, $includeSubfolders: Boolean, $limit: Int) {
    folderFiles(
      folderId: $folderId
      includeSubfolders: $includeSubfolders
      limit: $limit
    ) {
      totalAvailable
      totalReturned
      truncated
      files {
        relativePath
        file {
          ...FileFragment
        }
      }
    }
  }
`);
