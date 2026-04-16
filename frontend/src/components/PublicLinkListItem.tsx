import type { ManageFolderUserRow } from '@shared/types/queryRows';
import { normalizeDisplayName } from '@shared/displayName';
import { Avatar, Badge, Group, Paper, Stack, Text } from '@mantine/core';
import { CommentChip } from './CommentChip';
import { LinkModeChip } from './LinkModeChip';
import { CopyPublicLinkButton } from '../pages/management/CopyPublicLinkButton';
import { ViewFolderButton } from './ViewFolderButton';
import { FolderIcon } from '../PicrIcons';
import { CommentPermissions, LinkMode } from '@shared/gql/graphql';

export const PublicLinkListItem = ({
  user,
  onClick,
}: {
  user: ManageFolderUserRow;
  onClick: () => void;
}) => {
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
                {user.name ?? 'Unnamed'}
              </Text>
              {!user.enabled && (
                <Badge size="xs" color="red" variant="light">
                  Disabled
                </Badge>
              )}
            </Group>
            {user.folder ? (
              <Group gap={4} wrap="nowrap">
                <FolderIcon size={11} style={{ opacity: 0.4, flexShrink: 0 }} />
                <Text size="xs" c="dimmed" truncate>
                  {normalizeDisplayName(user.folder.name)}
                </Text>
              </Group>
            ) : null}
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
            disabled={!user.enabled || !user.uuid || !user.folderId}
            hash={user.uuid ?? undefined}
            folderId={user.folderId}
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
