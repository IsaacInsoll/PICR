import {
  createPicrColumns,
  type PicrColumns,
} from '../../components/PicrDataGrid';
import type { PicrUser } from '@shared/types/picr';
import { normalizeDisplayName } from '@shared/displayName';
import { FolderName } from '../../components/FolderName';
import { CopyPublicLinkButton } from './CopyPublicLinkButton';
import { CommentChip } from '../../components/CommentChip';
import { Badge, Group, Stack, Text } from '@mantine/core';
import { ViewFolderButton } from '../../components/ViewFolderButton';
import { BooleanIcon } from './BooleanIcon';
import { LinkModeChip } from '../../components/LinkModeChip';
import { CommentPermissions, LinkMode } from '@shared/gql/graphql';
import { PicrAvatar } from '../../components/PicrAvatar';
import { DateDisplay } from '../../components/FileListView/Filtering/PrettyDate';

const userColumn = createPicrColumns<PicrUser>();

export const userColumns: PicrColumns<PicrUser>[] = [
  userColumn.accessor('name', {
    header: 'User',
    minWidth: 220,
    cell: ({ row }) => <UserIdentity user={row.original} />,
  }),
  userColumn.accessor('username', {
    header: 'Email',
    minWidth: 160,
  }),
  userColumn.accessor('folder.name', {
    header: 'Folder',
    minWidth: 160,
    cell: ({ row }) =>
      row.original.folder ? <FolderName folder={row.original.folder} /> : null,
  }),
  userColumn.accessor('lastAccess', {
    header: 'Last Access',
    minWidth: 120,
    cell: ({ value }) => <LastAccess value={value} />,
  }),
  userColumn.accessor('enabled', {
    maxWidth: 90,
    header: 'Status',
    cell: ({ value }) => <StatusBadge enabled={!!value} />,
  }),
];

export const publicLinkColumns: PicrColumns<PicrUser>[] = [
  userColumn.accessor('name', {
    header: 'Link',
    minWidth: 220,
    cell: ({ row }) => <UserIdentity user={row.original} />,
  }),
  userColumn.accessor('folder.name', {
    header: 'Folder',
    minWidth: 160,
    cell: ({ row }) =>
      row.original.folder ? <FolderName folder={row.original.folder} /> : null,
  }),
  userColumn.accessor('enabled', {
    maxWidth: 90,
    header: 'Status',
    cell: ({ value }) => <StatusBadge enabled={!!value} />,
  }),
  userColumn.accessor('lastAccess', {
    header: 'Last Access',
    minWidth: 120,
    cell: ({ value }) => <LastAccess value={value} />,
  }),
  userColumn.accessor('commentPermissions', {
    header: 'Comments',
    maxWidth: 75,
    cell: ({ value }) => (
      <CommentChip commentPermissions={value ?? CommentPermissions.Read} />
    ),
  }),
  userColumn.accessor('linkMode', {
    header: 'Mode',
    maxWidth: 75,
    cell: ({ value }) => (
      <LinkModeChip linkMode={value ?? LinkMode.FinalDelivery} />
    ),
  }),
  userColumn.accessor('hasGalleryPasscode', {
    header: 'Passcode',
    maxWidth: 90,
    cell: ({ value }) =>
      value ? (
        <Badge size="sm" variant="light" color="green">
          Set
        </Badge>
      ) : (
        <Text size="sm" c="dimmed">
          None
        </Text>
      ),
  }),
  userColumn.display({
    id: 'actions',
    header: 'Actions',
    minWidth: 96,
    cell: ({ row }) => (
      <Group gap="xs" wrap="nowrap">
        <CopyPublicLinkButton
          disabled={
            !row.original.enabled ||
            !row.original.uuid ||
            !row.original.folderId
          }
          hash={row.original.uuid ?? undefined}
          folderId={row.original.folderId ?? undefined}
          variant="subtle"
          size="compact-sm"
          iconOnly
        />
        {row.original.folder ? (
          <ViewFolderButton
            folder={row.original.folder}
            variant="subtle"
            size="compact-sm"
            iconOnly
          />
        ) : null}
      </Group>
    ),
  }),
];

export const userSearchText = (user: PicrUser) =>
  [
    user.name,
    user.username,
    user.uuid,
    user.enabled ? 'enabled active' : 'disabled inactive',
    user.hasGalleryPasscode ? 'passcode password protected' : 'no passcode',
    user.commentPermissions,
    user.linkMode,
    user.lastAccess,
    user.folder?.name,
    normalizeDisplayName(user.folder?.name),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

const UserIdentity = ({
  user,
  subtitle,
}: {
  user: PicrUser;
  subtitle?: string;
}) => (
  <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
    <PicrAvatar user={user} size="sm" radius="xl" />
    <Stack gap={0} style={{ minWidth: 0 }}>
      <Text fw={500} size="sm" truncate>
        {user.name ?? 'Unnamed'}
      </Text>
      {subtitle ? (
        <Text size="xs" c="dimmed" truncate>
          {subtitle}
        </Text>
      ) : null}
    </Stack>
  </Group>
);

const StatusBadge = ({ enabled }: { enabled: boolean }) => (
  <Badge
    size="sm"
    variant="light"
    color={enabled ? 'green' : 'red'}
    leftSection={<BooleanIcon value={enabled} />}
  >
    {enabled ? 'Enabled' : 'Disabled'}
  </Badge>
);

const LastAccess = ({ value }: { value?: string | null }) =>
  value ? (
    <DateDisplay dateString={value} />
  ) : (
    <Text size="sm" c="dimmed">
      Never
    </Text>
  );
