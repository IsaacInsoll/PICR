import { useMe } from './useMe';
import { CommentPermissions } from '../../../graphql-types';

export const useCommentPermissions = (): UseCommentPermissionsResult => {
  const me = useMe();
  const perms = me.commentPermissions ?? CommentPermissions.None;
  return {
    commentPermissions: perms,
    isNone: perms == CommentPermissions.None,
    readOnly: perms == CommentPermissions.Read,
    canEdit: perms == CommentPermissions.Edit,
  };
};

interface UseCommentPermissionsResult {
  commentPermissions: CommentPermissions;
  readOnly: boolean;
  canEdit: boolean;
  isNone: boolean;
}
