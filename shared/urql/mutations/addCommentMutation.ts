import { gql } from '../gql';

export const addCommentMutation = gql(/* GraphQL */ `
  mutation addComment(
    $id: ID!
    $rating: Int
    $flag: FileFlag
    $comment: String
    $nickName: String
  ) {
    addComment(
      id: $id
      rating: $rating
      flag: $flag
      comment: $comment
      nickName: $nickName
    ) {
      ...FileFragment
    }
  }
`);
