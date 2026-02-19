import { gql } from '../gql';

export const appViewFolderSubFolderFragment = gql(/* GraphQL */ `
  fragment AppViewFolderSubFolderFragment on Folder {
    ...MinimumFolderFragment
    users {
      id
      name
      enabled
      commentPermissions
      gravatar
    }
  }
`);
