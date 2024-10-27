import { CommentPermissions } from '../../../graphql-types';
import { Badge } from '@mantine/core';
import { commentPermissionsStyle } from './CommentPermissionsStyle';

export const CommentChip = ({
  commentPermissions,
}: {
  commentPermissions: CommentPermissions;
}) => {
  const { icon, color } = commentPermissionsStyle[commentPermissions];
  return (
    <Badge color={color} size="sm" leftSection={icon}>
      {commentPermissions}
    </Badge>
  );
};
