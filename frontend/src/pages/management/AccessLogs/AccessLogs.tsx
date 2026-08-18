import { useQuery } from 'urql';
import {
  createPicrColumns,
  type PicrColumns,
  PicrDataGrid,
} from '../../../components/PicrDataGrid';
import { UserType } from '@shared/gql/graphql';
import { DateDisplay } from '../../../components/FileListView/Filtering/PrettyDate';
import { LazyPicrAvatar } from '../../../components/LazyPicrAvatar';
import { Code, Stack } from '@mantine/core';
import type { PicrUser } from '@shared/types/picr';
import { Suspense, useState } from 'react';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { AccessLogsUsersSelector } from './AccessLogsUsersSelector';
import { FolderName } from '../../../components/FolderName';
import { EmptyPlaceholder } from '../../EmptyPlaceholder';
import { UnlinkIcon } from '../../../PicrIcons';
import { accessLogQuery } from '@shared/urql/queries/accessLogQuery';
import type { AccessLogRow } from '@shared/types/queryRows';
import { AccessLogListItem } from '../../../components/AccessLogListItem';
import { AccessLogClientMeta } from '../../../components/AccessLogClientMeta';
import { useTranslation } from 'react-i18next';
import type { AdminT } from '../../../i18n/adminLabels';

const accessLogColumn = createPicrColumns<AccessLogRow>();

export const AccessLogs = ({
  folderId,
  includeChildren,
  variant = 'table',
  selectedUserId,
  onSelectUserId,
}: {
  folderId: string;
  users?: PicrUser[];
  includeChildren?: boolean;
  variant?: 'table' | 'list';
  selectedUserId?: string;
  onSelectUserId?: (userId?: string) => void;
}) => {
  const { t } = useTranslation('admin');
  const [localUserId, setLocalUserId] = useState<string | undefined>(undefined);
  const userId = onSelectUserId ? selectedUserId : localUserId;
  const setUserId = onSelectUserId ?? setLocalUserId;

  return (
    <Stack>
      <AccessLogsUsersSelector
        folderId={folderId}
        userId={userId}
        setUserId={setUserId}
        includeChildren={includeChildren}
      />
      <Suspense fallback={<LoadingIndicator />}>
        <Body
          folderId={folderId}
          userId={userId}
          includeChildren={includeChildren}
          variant={variant}
          t={t}
        />
      </Suspense>
    </Stack>
  );
};

const Body = ({
  folderId,
  userId,
  includeChildren,
  variant,
  t,
}: {
  folderId: string;
  userId?: string;
  includeChildren?: boolean;
  variant: 'table' | 'list';
  t: AdminT;
}) => {
  const [result] = useQuery({
    query: accessLogQuery,
    variables: { folderId, userId, includeChildren, userType: UserType.Link },
  });
  const data = result.data?.accessLogs ?? [];

  if (data.length === 0) {
    return (
      <EmptyPlaceholder text={t('accessLogs.empty')} icon={<UnlinkIcon />} />
    );
  }

  if (variant === 'list') {
    return (
      <Stack gap="xs">
        {data.map((log) => (
          <AccessLogListItem key={log.id} log={log} />
        ))}
      </Stack>
    );
  }

  return <PicrDataGrid columns={accessLogColumns(t)} data={data} />;
};

const accessLogColumns = (t: AdminT): PicrColumns<AccessLogRow>[] => [
  accessLogColumn.accessor('timestamp', {
    header: t('accessLogs.columns.time'),
    cell: ({ value }) => {
      return <DateDisplay dateString={value} />;
    },
  }),
  accessLogColumn.accessor('folder.name', {
    header: t('users.columns.folder'),
    minWidth: 25,
    cell: ({ row }) =>
      row.original.folder ? (
        <FolderName
          folder={{
            id: row.original.folder.id,
            name: row.original.folder.name,
            title: row.original.folder.title,
            subtitle: row.original.folder.subtitle,
            parentId: row.original.folder.parentId,
          }}
        />
      ) : null,
  }),
  accessLogColumn.accessor('userId', {
    header: t('users.columns.user'),
    minWidth: 25,
    cell: ({ value }) => (
      <Suspense fallback={<LoadingIndicator size="small" />}>
        {value ? (
          <LazyPicrAvatar
            userId={String(value)}
            props={{ size: 'sm' }}
            showName={true}
          />
        ) : null}
      </Suspense>
    ),
  }),
  // { accessorKey: 'folderId', header: 'Folder', minWidth: 25 },
  accessLogColumn.accessor('ipAddress', {
    header: t('accessLogs.columns.ipAddress'),
    minWidth: 25,
    cell: ({ value }) => (value ? <Code>{String(value)}</Code> : null),
  }),
  accessLogColumn.accessor('userAgent', {
    header: t('accessLogs.columns.userAgent'),
    minWidth: 75,
    enableSorting: false,
    cell: ({ value }) => (
      <AccessLogClientMeta
        userAgent={value ? String(value) : null}
        showIpAddress={false}
      />
    ),
  }),
];
