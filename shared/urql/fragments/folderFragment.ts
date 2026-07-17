import { gql } from '../gql';

// The folder you are viewing: everything MinimumFolderFragment carries, plus
// the branding/permissions only the current folder needs. Spreading Minimum
// keeps the two tiers in sync - anything a folder link needs is automatically
// here too.
export const folderFragment = gql(/* GraphQL */ `
  fragment FolderFragment on Folder {
    ...MinimumFolderFragment
    brandingId
    permissions
    branding {
      ...BrandingFragment
    }
  }
`);
