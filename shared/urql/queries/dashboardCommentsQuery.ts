import { gql } from '../gql';

// Recent client feedback across the whole home-folder subtree (comments +
// system-generated rating/flag events). Reuses AppCommentHistoryCommentFragment
// so the existing <CommentHistory /> component can render it directly.
export const dashboardCommentsQuery = gql(/* GraphQL */ `
  query dashboardCommentsQuery($id: ID!, $limit: Int) {
    comments(folderId: $id, includeChildren: true, limit: $limit) {
      ...AppCommentHistoryCommentFragment
    }
  }
`);
