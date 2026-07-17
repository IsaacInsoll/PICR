import { gql } from '../gql';

// Read straight from the graphcache (never the network) to show the destination
// folder while its real query loads - see frontend useFolderPlaceholder.
//
// Selects MinimumFolderFragment rather than a hand-picked field list, so the
// read contract and the write contract are the same document: "did the source
// cache enough?" has one answer instead of a per-field matrix. It also brings
// the banner fields, letting the placeholder render the right banner at the
// right height instead of a title that vanishes when the real data lands.
//
// This is why every folder rendered as a folder must select Minimum: it carries
// the non-null folderLastModified, so a thinner selection is a hard miss
// (generic "Loading") rather than a partial hit that still shows the name.
export const folderPlaceholderQuery = gql(/* GraphQL */ `
  query FolderPlaceholder($folderId: ID!) {
    folder(id: $folderId) {
      ...MinimumFolderFragment
    }
  }
`);
