import type { ManageFolderUserRow } from '@shared/types/queryRows';
import { Avatar, Badge, Group, Paper, Stack, Text } from '@mantine/core';
import { CommentChip } from './CommentChip';
import { LinkModeChip } from './LinkModeChip';
import { CopyPublicLinkButton } from '../pages/management/CopyPublicLinkButton';
import { ViewFolderButton } from './ViewFolderButton';
import { FolderIcon } from '../PicrIcons';
import { CommentPermissions, LinkMode } from '@shared/gql/graphql';
import { useTranslation } from 'react-i18next';
import { useFolderNameFormatter } from '../i18n/useFolderNameFormatter';
import { PublicLinkExpiration } from './PublicLinkExpiration';
import { publicLinkStatus } from '@shared/publicLinkExpiration';

export const PublicLinkListItem = ({
  user,
  onClick,
  now,
}: {
  user: ManageFolderUserRow;
  onClick: () => void;
  now: number;
}) => {
  const { t } = useTranslation('admin');
  const formatFolderName = useFolderNameFormatter();
  const status = publicLinkStatus(user, now);
  const statusLabel =
    status === 'active'
      ? t('common.enabled')
      : status === 'expired'
        ? t('links.expired')
        : t('common.disabled');
  return (
    <Paper
      withBorder
      p="sm"
      radius="md"
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <Group wrap="nowrap" justify="space-between">
        <Group wrap="nowrap" gap="sm" style={{ minWidth: 0, flex: 1 }}>
          <Avatar
            name={user.name ?? undefined}
            color="initials"
            radius="xl"
            size="md"
          />
          <Stack gap={3} style={{ minWidth: 0 }}>
            <Group gap="xs" wrap="nowrap">
              <Text fw={500} size="sm" truncate>
                {user.name ?? t('common.unnamed')}
              </Text>
              <Badge
                size="xs"
                color={status === 'active' ? 'green' : 'red'}
                variant="light"
              >
                {statusLabel}
              </Badge>
            </Group>
            {user.folder ? (
              <Group gap={4} wrap="nowrap">
                <FolderIcon size={11} style={{ opacity: 0.4, flexShrink: 0 }} />
                <Text size="xs" c="dimmed" truncate>
                  {formatFolderName(user.folder)}
                </Text>
              </Group>
            ) : null}
            <PublicLinkExpiration expiresAt={user.expiresAt} />
            <Group gap="xs" wrap="nowrap">
              <CommentChip
                commentPermissions={
                  user.commentPermissions ?? CommentPermissions.Read
                }
              />
              <LinkModeChip
                linkMode={user.linkMode ?? LinkMode.FinalDelivery}
              />
            </Group>
          </Stack>
        </Group>
        <Stack
          gap="xs"
          onClick={(e) => e.stopPropagation()}
          style={{ flexShrink: 0 }}
          align="stretch"
        >
          <CopyPublicLinkButton
            disabled={status !== 'active' || !user.uuid}
            hash={user.uuid ?? undefined}
            variant="subtle"
            size="compact-sm"
          />
          {user.folder ? (
            <ViewFolderButton
              folder={user.folder}
              variant="subtle"
              size="compact-sm"
            />
          ) : null}
        </Stack>
      </Group>
    </Paper>
  );
};
