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
import { PublicLinkExpiration } from '../../components/PublicLinkExpiration';
import {
  publicLinkStatus,
  type PublicLinkStatus,
} from '@shared/publicLinkExpiration';

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

export const publicLinkColumns = (
  t: AdminT,
  now: number,
): PicrColumns<PicrUser>[] => [
  userColumn.accessor('name', {
    header: t('links.columns.link', { ns: 'admin' }),
    minWidth: 220,
    cell: ({ row }) => (
      <UserIdentity user={row.original} t={t} showExpiration />
    ),
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
    cell: ({ row }) => (
      <PublicLinkStatusBadge user={row.original} t={t} now={now} />
    ),
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
    cell: ({ row }) => <PublicLinkActions user={row.original} now={now} />,
  }),
];

export const userSearchText = (
  user: PicrUser,
  t: AdminT,
  status: PublicLinkStatus,
) => {
  const translatedStatus =
    status === 'active'
      ? t('common.enabled', { ns: 'admin' })
      : status === 'expired'
        ? t('links.expired', { ns: 'admin' })
        : t('common.disabled', { ns: 'admin' });

  return [
    user.name,
    user.username,
    user.uuid,
    user.enabled ? 'enabled active' : 'disabled inactive',
    user.hasGalleryPasscode ? 'passcode password protected' : 'no passcode',
    user.commentPermissions,
    user.linkMode,
    status,
    translatedStatus,
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
};

const UserIdentity = ({
  user,
  subtitle,
  t,
  showExpiration = false,
}: {
  user: PicrUser;
  subtitle?: string;
  t: AdminT;
  showExpiration?: boolean;
}) => (
  <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
    <PicrAvatar user={user} size="sm" radius="xl" />
    <Stack gap={0} style={{ minWidth: 0 }}>
      <Group gap="xs" wrap="nowrap">
        <Text fw={500} size="sm" truncate>
          {user.name ?? t('common.unnamed', { ns: 'admin' })}
        </Text>
      </Group>
      {showExpiration ? (
        <PublicLinkExpiration expiresAt={user.expiresAt} />
      ) : null}
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

const PublicLinkStatusBadge = ({
  user,
  t,
  now,
}: {
  user: PicrUser;
  t: AdminT;
  now: number;
}) => {
  const status = publicLinkStatus(user, now);
  const active = status === 'active';

  return (
    <Badge
      size="sm"
      variant="light"
      color={active ? 'green' : 'red'}
      leftSection={<BooleanIcon value={active} />}
    >
      {active
        ? t('common.enabled', { ns: 'admin' })
        : status === 'expired'
          ? t('links.expired', { ns: 'admin' })
          : t('common.disabled', { ns: 'admin' })}
    </Badge>
  );
};

const PublicLinkActions = ({ user, now }: { user: PicrUser; now: number }) => {
  const status = publicLinkStatus(user, now);

  return (
    <Group gap="xs" wrap="nowrap">
      <CopyPublicLinkButton
        disabled={status !== 'active' || !user.uuid}
        hash={user.uuid ?? undefined}
        variant="subtle"
        size="compact-sm"
        iconOnly
      />
      {user.folder ? (
        <ViewFolderButton
          folder={user.folder}
          variant="subtle"
          size="compact-sm"
          iconOnly
        />
      ) : null}
    </Group>
  );
};

const LastAccess = ({ value, t }: { value?: string | null; t: AdminT }) =>
  value ? (
    <DateDisplay dateString={value} />
  ) : (
    <Text size="sm" c="dimmed">
      {t('common.never', { ns: 'admin' })}
    </Text>
  );
