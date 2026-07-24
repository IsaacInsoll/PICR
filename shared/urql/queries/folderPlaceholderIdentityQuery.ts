import { gql } from '../gql';

// A cache-only read for the folder heading while the real folder view loads.
// This intentionally omits banner and full breadcrumb fields; those still come
// from folderPlaceholderQuery when the full MinimumFolderFragment is cached.
export const folderPlaceholderIdentityQuery = gql(/* GraphQL */ `
  query FolderPlaceholderIdentity($folderId: ID!) {
    folder(id: $folderId) {
      ...FolderPlaceholderIdentityFragment
    }
  }
`);
