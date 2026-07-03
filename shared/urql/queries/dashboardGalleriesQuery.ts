import { gql } from '../gql';

// Top-level folders under the user's home folder ("Your Galleries"). Uses
// MinimumFolderFragment which carries heroImage + folderLastModified — both
// cheap — so we avoid per-folder subtree aggregates here.
export const dashboardGalleriesQuery = gql(/* GraphQL */ `
  query dashboardGalleriesQuery($id: ID!) {
    folder(id: $id) {
      id
      branding {
        ...BrandingFragment
      }
      subFolders {
        ...MinimumFolderFragment
      }
    }
  }
`);
