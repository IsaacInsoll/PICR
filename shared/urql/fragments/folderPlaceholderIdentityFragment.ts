import { gql } from '../gql';

// The small folder identity contract used by the loading placeholder when a
// full MinimumFolderFragment cache hit is unavailable. Keep this cheap: it is
// also selected for breadcrumb parent entities so clicking an ancestor can show
// its real heading while the folder query loads.
export const folderPlaceholderIdentityFragment = gql(/* GraphQL */ `
  fragment FolderPlaceholderIdentityFragment on Folder {
    id
    __typename
    name
    title
    subtitle
    parentId
  }
`);
