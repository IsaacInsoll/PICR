import { gql } from '../gql';

export const editFolderMutation = gql(/* GraphQL */ `
  mutation editFolder(
    $folderId: ID!
    $heroImageId: ID
    $bannerImageId: ID
    $bannerSize: String
    $bannerTextHAlign: String
    $bannerTextVAlign: String
    $title: String
    $subtitle: String
  ) {
    editFolder(
      folderId: $folderId
      heroImageId: $heroImageId
      bannerImageId: $bannerImageId
      bannerSize: $bannerSize
      bannerTextHAlign: $bannerTextHAlign
      bannerTextVAlign: $bannerTextVAlign
      title: $title
      subtitle: $subtitle
    ) {
      ...FolderFragment
      ...HeroImageFragment
    }
  }
`);
