import { useQuery } from 'urql';
import type { PicrColumns } from '../../../components/PicrDataGrid';
import { PicrDataGrid } from '../../../components/PicrDataGrid';
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

export const AccessLogs = ({
  folderId,
  includeChildren,
  variant = 'table',
}: {
  folderId: string;
  users?: PicrUser[];
  includeChildren?: boolean;
  variant?: 'table' | 'list';
}) => {
  const [userId, setUserId] = useState<string | undefined>(undefined);

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
}: {
  folderId: string;
  userId?: string;
  includeChildren?: boolean;
  variant: 'table' | 'list';
}) => {
  const [result] = useQuery({
    query: accessLogQuery,
    variables: { folderId, userId, includeChildren, userType: UserType.Link },
  });
  const data = result.data?.accessLogs ?? [];

  if (data.length === 0) {
    return (
      <EmptyPlaceholder
        text="Nobody has used a public link to view this folder (yet!)"
        icon={<UnlinkIcon />}
      />
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

  return (
    <PicrDataGrid columns={accessLogColumns} data={data} onClick={() => {}} />
  );
};

const accessLogColumns: PicrColumns<AccessLogRow>[] = [
  {
    accessorKey: 'timestamp',
    header: 'Time',
    Cell: ({ cell }) => {
      return <DateDisplay dateString={cell.getValue() as string} />;
    },
  },
  {
    accessorKey: 'folder.name',
    header: 'Folder',
    minSize: 25,
    accessorFn: ({ folder }) =>
      folder ? (
        <FolderName
          folder={{
            id: folder.id,
            name: folder.name,
            title: folder.title,
            subtitle: folder.subtitle,
            parentId: folder.parentId,
          }}
        />
      ) : null,
  },
  {
    header: 'User',
    minSize: 25,
    accessorFn: (al: AccessLogRow) => (
      <Suspense fallback={<LoadingIndicator size="small" />}>
        {al.userId ? (
          <LazyPicrAvatar
            userId={al.userId}
            props={{ size: 'sm' }}
            showName={true}
          />
        ) : null}
      </Suspense>
    ),
  },
  // { accessorKey: 'folderId', header: 'Folder', minSize: 25 },
  {
    header: 'IP Address',
    minSize: 25,
    accessorFn: (al: AccessLogRow) =>
      al.ipAddress ? <Code>{al.ipAddress}</Code> : null,
  },
  {
    header: 'User Agent',
    minSize: 75,
    accessorFn: (al: AccessLogRow) => (
      <AccessLogClientMeta userAgent={al.userAgent} showIpAddress={false} />
    ),
  },
];
