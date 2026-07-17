import { gql } from '../gql';

// The base contract for any folder rendered AS a folder - card, row, link,
// breadcrumb, chip, search hit. Carries enough to render the folder itself and
// its loading placeholder (see frontend useFolderPlaceholder), so a folder you
// can click is always a cache hit on arrival. Do not hand-roll a thinner
// selection: that drift is what made the header "Home" link show "Loading".
//
// The folder you are actually viewing uses FolderFragment (this + branding +
// permissions) via viewFolderQuery.
export const minimumFolderFragment = gql(/* GraphQL */ `
  fragment MinimumFolderFragment on Folder {
    id
    __typename
    name
    title
    subtitle
    parentId
    parents {
      id
      name
    }
    folderLastModified
    ...HeroImageFragment
    ...FolderBannerFragment
  }
`);
