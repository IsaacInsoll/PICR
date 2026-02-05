import { gql } from '../gql';

export const editFolderMutation = gql(/* GraphQL */ `
  mutation editFolder(
    $folderId: ID!
    $heroImageId: ID
    $title: String
    $subtitle: String
  ) {
    editFolder(
      folderId: $folderId
      heroImageId: $heroImageId
      title: $title
      subtitle: $subtitle
    ) {
      ...FolderFragment
      ...HeroImageFragment
    }
  }
`);
