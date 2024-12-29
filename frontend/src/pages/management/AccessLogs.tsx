import { gql } from '../../helpers/gql';
import { useQuery } from 'urql';
import { PicrColumns, PicrDataGrid } from '../../components/PicrDataGrid';
import { AccessLog } from '../../../../graphql-types';
import { fromNow } from '../../components/FileListView/Filtering/PrettyDate';
import { LazyPicrAvatar } from '../../components/LazyPicrAvatar';
import { UAParser } from 'ua-parser-js';
import { Badge, BadgeProps, Code, Group, Select, Stack } from '@mantine/core';
import { MinimalSharedFolder } from '../../../types';
import { Suspense, useState } from 'react';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { manageFolderQuery } from '../../urql/queries/manageFolderQuery';

export const AccessLogs = ({
  folderId,
  users,
}: {
  folderId: string;
  users?: MinimalSharedFolder[];
}) => {
  const [userId, setUserId] = useState<string | undefined>(undefined);

  return (
    <Stack>
      <AccessLogsUsersSelector
        folderId={folderId}
        userId={userId}
        setUserId={setUserId}
      />
      <Suspense fallback={<LoadingIndicator />}>
        <Body folderId={folderId} userId={userId} />
      </Suspense>
    </Stack>
  );
};

const Body = ({ folderId, userId }) => {
  const [result] = useQuery({
    query: accessLogQuery,
    variables: { folderId, userId },
  });
  const data = result.data?.accessLogs ?? [];

  return (
    <PicrDataGrid
      columns={accessLogColumns}
      data={data}
      onClick={(row) => console.log(row)}
    />
  );
};

const accessLogQuery = gql(/* GraphQL */ `
  query AccessLogsQuery($folderId: ID!, $userId: ID) {
    accessLogs(folderId: $folderId, userId: $userId) {
      id
      timestamp
      userId
      folderId
      ipAddress
      userAgent
    }
  }
`);

const accessLogColumns: PicrColumns<AccessLog>[] = [
  {
    accessorKey: 'timestamp',
    header: 'Time',
    Cell: ({ cell }) => {
      const latest: string = cell.getValue();
      return latest ? fromNow(latest) : '';
    },
  },
  {
    header: 'User',
    minSize: 25,
    accessorFn: (al: AccessLog) => (
      <LazyPicrAvatar userId={al.userId} size="sm" showName={true} />
    ),
  },
  // { accessorKey: 'folderId', header: 'Folder', minSize: 25 },
  {
    header: 'IP Address',
    minSize: 25,
    accessorFn: (al: AccessLog) =>
      al.ipAddress ? <Code>{al.ipAddress}</Code> : null,
  },
  {
    header: 'User Agent',
    minSize: 75,
    accessorFn: (al: AccessLog) => <UserAgent userAgent={al.userAgent} />,
  },
  // {
  //   header: 'Comments',
  //   maxSize: 75,
  //   accessorFn: (user: User) => (
  //     <CommentChip commentPermissions={user.commentPermissions} />
  //   ),
  // },
];

const UserAgent = ({ userAgent }: { userAgent: string }) => {
  if (!userAgent) return null;
  const uap = UAParser(userAgent);

  const { device, browser, os } = uap;
  return (
    <Group>
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

const AccessLogsUsersSelector = ({ folderId, userId, setUserId }) => {
  const [result] = useQuery({
    query: manageFolderQuery,
    variables: { folderId, includeParents: false, includeChildren: false },
  });
  const users = result.data?.users ?? [];
  if (!users.length) return null;
  return (
    <Select
      pt="md"
      clearable
      label="Filter by Link"
      placeholder="<Any user or link>"
      value={userId}
      onChange={(e) => setUserId(e)}
      data={users.map((u) => ({ value: u.id, label: u.name }))}
    />
  );
};
