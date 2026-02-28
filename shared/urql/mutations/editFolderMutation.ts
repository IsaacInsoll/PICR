import { gql } from '../gql';

export const editFolderMutation = gql(/* GraphQL */ `
  mutation editFolder(
    $folderId: ID!
    $heroImageId: ID
    $bannerImageId: ID
    $title: String
    $subtitle: String
  ) {
    editFolder(
      folderId: $folderId
      heroImageId: $heroImageId
      bannerImageId: $bannerImageId
      title: $title
      subtitle: $subtitle
    ) {
      ...FolderFragment
      ...HeroImageFragment
    }
  }
`);
