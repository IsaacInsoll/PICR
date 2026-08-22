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
import type { AdminT } from '../../i18n/adminLabels';

const userColumn = createPicrColumns<PicrUser>();

export const userColumns = (t: AdminT): PicrColumns<PicrUser>[] => [
  userColumn.accessor('name', {
    header: t('users.columns.user', { ns: 'admin' }),
    minWidth: 220,
    cell: ({ row }) => <UserIdentity user={row.original} t={t} />,
  }),
  userColumn.accessor('username', {
    header: t('users.columns.email', { ns: 'admin' }),
    minWidth: 160,
  }),
  userColumn.accessor('folder.name', {
    header: t('users.columns.folder', { ns: 'admin' }),
    minWidth: 160,
    cell: ({ row }) =>
      row.original.folder ? <FolderName folder={row.original.folder} /> : null,
  }),
  userColumn.accessor('lastAccess', {
    header: t('users.columns.lastAccess', { ns: 'admin' }),
    minWidth: 120,
    cell: ({ value }) => <LastAccess value={value} t={t} />,
  }),
  userColumn.accessor('enabled', {
    maxWidth: 90,
    header: t('users.columns.status', { ns: 'admin' }),
    cell: ({ value }) => <StatusBadge enabled={!!value} t={t} />,
  }),
];

export const publicLinkColumns = (t: AdminT): PicrColumns<PicrUser>[] => [
  userColumn.accessor('name', {
    header: t('links.columns.link', { ns: 'admin' }),
    minWidth: 220,
    cell: ({ row }) => <UserIdentity user={row.original} t={t} />,
  }),
  userColumn.accessor('folder.name', {
    header: t('users.columns.folder', { ns: 'admin' }),
    minWidth: 160,
    cell: ({ row }) =>
      row.original.folder ? <FolderName folder={row.original.folder} /> : null,
  }),
  userColumn.accessor('enabled', {
    maxWidth: 90,
    header: t('users.columns.status', { ns: 'admin' }),
    cell: ({ value }) => <StatusBadge enabled={!!value} t={t} />,
  }),
  userColumn.accessor('lastAccess', {
    header: t('users.columns.lastAccess', { ns: 'admin' }),
    minWidth: 120,
    cell: ({ value }) => <LastAccess value={value} t={t} />,
  }),
  userColumn.accessor('commentPermissions', {
    header: t('links.columns.comments', { ns: 'admin' }),
    maxWidth: 75,
    cell: ({ value }) => (
      <CommentChip commentPermissions={value ?? CommentPermissions.Read} />
    ),
  }),
  userColumn.accessor('linkMode', {
    header: t('links.columns.mode', { ns: 'admin' }),
    maxWidth: 75,
    cell: ({ value }) => (
      <LinkModeChip linkMode={value ?? LinkMode.FinalDelivery} />
    ),
  }),
  userColumn.accessor('hasGalleryPasscode', {
    header: t('links.columns.passcode', { ns: 'admin' }),
    maxWidth: 90,
    cell: ({ value }) =>
      value ? (
        <Badge size="sm" variant="light" color="green">
          {t('links.passcodeSet', { ns: 'admin' })}
        </Badge>
      ) : (
        <Text size="sm" c="dimmed">
          {t('common.none', { ns: 'admin' })}
        </Text>
      ),
  }),
  userColumn.display({
    id: 'actions',
    header: t('common.actions', { ns: 'admin' }),
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

export const userSearchText = (user: PicrUser, t: AdminT) =>
  [
    user.name,
    user.username,
    user.uuid,
    user.enabled ? 'enabled active' : 'disabled inactive',
    user.hasGalleryPasscode ? 'passcode password protected' : 'no passcode',
    user.commentPermissions,
    user.linkMode,
    user.enabled
      ? t('common.enabled', { ns: 'admin' })
      : t('common.disabled', { ns: 'admin' }),
    user.hasGalleryPasscode
      ? t('links.passcodeProtected', { ns: 'admin' })
      : t('links.noPasscode', { ns: 'admin' }),
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
  t,
}: {
  user: PicrUser;
  subtitle?: string;
  t: AdminT;
}) => (
  <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
    <PicrAvatar user={user} size="sm" radius="xl" />
    <Stack gap={0} style={{ minWidth: 0 }}>
      <Group gap="xs" wrap="nowrap">
        <Text fw={500} size="sm" truncate>
          {user.name ?? t('common.unnamed', { ns: 'admin' })}
        </Text>
        {user.expiresAt && new Date(user.expiresAt) <= new Date() && (
          <Text size="xs" c="red" fw={500}>
            {t('links.expired', { ns: 'admin' })}
          </Text>
        )}
      </Group>
      {subtitle ? (
        <Text size="xs" c="dimmed" truncate>
          {subtitle}
        </Text>
      ) : null}
    </Stack>
  </Group>
);

const StatusBadge = ({ enabled, t }: { enabled: boolean; t: AdminT }) => (
  <Badge
    size="sm"
    variant="light"
    color={enabled ? 'green' : 'red'}
    leftSection={<BooleanIcon value={enabled} />}
  >
    {enabled
      ? t('common.enabled', { ns: 'admin' })
      : t('common.disabled', { ns: 'admin' })}
  </Badge>
);

const LastAccess = ({ value, t }: { value?: string | null; t: AdminT }) =>
  value ? (
    <DateDisplay dateString={value} />
  ) : (
    <Text size="sm" c="dimmed">
      {t('common.never', { ns: 'admin' })}
    </Text>
  );
