import { useMe } from './useMe';
import { CommentPermissions } from '../../../graphql-types';

export const useCommentPermissions = (): UseCommentPermissionsResult => {
  const me = useMe();
  const perms = me.commentPermissions ?? CommentPermissions.None;
  return {
    commentPermissions: perms,
    canView: perms == CommentPermissions.Read,
    canEdit: perms == CommentPermissions.Edit,
  };
};

interface UseCommentPermissionsResult {
  commentPermissions: CommentPermissions;
  canView: boolean;
  canEdit: boolean;
}
