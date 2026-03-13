import { gql } from '../gql';

export const editFolderMutation = gql(/* GraphQL */ `
  mutation editFolder(
    $folderId: ID!
    $heroImageId: ID
    $bannerImageId: ID
    $bannerSize: String
    $title: String
    $subtitle: String
  ) {
    editFolder(
      folderId: $folderId
      heroImageId: $heroImageId
      bannerImageId: $bannerImageId
      bannerSize: $bannerSize
      title: $title
      subtitle: $subtitle
    ) {
      ...FolderFragment
      ...HeroImageFragment
    }
  }
`);
