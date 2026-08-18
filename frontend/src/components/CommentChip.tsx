import type { CommentPermissions } from '@shared/gql/graphql';
import { Badge } from '@mantine/core';
import { commentPermissionsStyle } from './CommentPermissionsStyle';
import { useTranslation } from 'react-i18next';

export const CommentChip = ({
  commentPermissions,
}: {
  commentPermissions: CommentPermissions;
}) => {
  const { t } = useTranslation('admin');
  const { icon, color } = commentPermissionsStyle[commentPermissions];
  const label =
    commentPermissions === 'none'
      ? t('links.comments.none')
      : commentPermissions === 'read'
        ? t('links.comments.read')
        : t('links.comments.edit');
  return (
    <Badge color={color} size="sm" leftSection={icon}>
      {label}
    </Badge>
  );
};
