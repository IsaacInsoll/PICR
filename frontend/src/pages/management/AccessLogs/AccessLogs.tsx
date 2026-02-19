import { useQuery } from 'urql';
import { PicrColumns, PicrDataGrid } from '../../../components/PicrDataGrid';
import { UserType } from '../../../../../graphql-types';
import { DateDisplay } from '../../../components/FileListView/Filtering/PrettyDate';
import { LazyPicrAvatar } from '../../../components/LazyPicrAvatar';
import { UAParser } from 'ua-parser-js';
import { Badge, BadgeProps, Code, Group, Stack } from '@mantine/core';
import { PicrUser } from '../../../../types';
import { Suspense, useState } from 'react';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { AccessLogsUsersSelector } from './AccessLogsUsersSelector';
import { FolderName } from '../../../components/FolderName';
import { EmptyPlaceholder } from '../../EmptyPlaceholder';
import { UnlinkIcon } from '../../../PicrIcons';
import { accessLogQuery } from '@shared/urql/queries/accessLogQuery';
import { AccessLogsQueryQuery } from '@shared/gql/graphql';

export const AccessLogs = ({
  folderId,
  includeChildren,
}: {
  folderId: string;
  users?: PicrUser[];
  includeChildren?: boolean;
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
        />
      </Suspense>
    </Stack>
  );
};

const Body = ({
  folderId,
  userId,
  includeChildren,
}: {
  folderId: string;
  userId?: string;
  includeChildren?: boolean;
}) => {
  const [result] = useQuery({
    query: accessLogQuery,
    variables: { folderId, userId, includeChildren, userType: UserType.Link },
  });
  const data = result.data?.accessLogs ?? [];

  return (
    <>
      {data.length > 0 ? (
        <PicrDataGrid
          columns={accessLogColumns}
          data={data}
          onClick={() => {}}
        />
      ) : (
        <EmptyPlaceholder
          text="Nobody has used a public link to view this folder (yet!)"
          icon={<UnlinkIcon />}
        />
      )}
    </>
  );
};

type AccessLogRow = AccessLogsQueryQuery['accessLogs'][number];

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
    accessorFn: (al: AccessLogRow) => <UserAgent userAgent={al.userAgent} />,
  },
];

const UserAgent = ({ userAgent }: { userAgent?: string | null }) => {
  if (!userAgent) return null;
  const uap = UAParser(userAgent);

  const { device, browser, os } = uap;
  return (
    <Group gap="xs">
      {browser.name ? (
        <Badge {...badgeProps} variant="outline">
          {browser.name}
        </Badge>
      ) : null}
      {device.model ? <Badge {...badgeProps}>{device.toString()}</Badge> : null}
      {os.name ? (
        <Badge {...badgeProps} variant="light">
          {os.toString()}
        </Badge>
      ) : null}
    </Group>
  );
};

const badgeProps: BadgeProps = { size: 'xs' };
