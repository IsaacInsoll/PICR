import { gql } from '../../../helpers/gql';
import { useQuery } from 'urql';
import { PicrColumns, PicrDataGrid } from '../../../components/PicrDataGrid';
import { AccessLog, UserType } from '../../../../../graphql-types';
import { fromNow } from '../../../components/FileListView/Filtering/PrettyDate';
import { LazyPicrAvatar } from '../../../components/LazyPicrAvatar';
import { UAParser } from 'ua-parser-js';
import { Badge, BadgeProps, Code, Group, Stack } from '@mantine/core';
import { MinimalSharedFolder } from '../../../../types';
import { Suspense, useState } from 'react';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { AccessLogsUsersSelector } from './AccessLogsUsersSelector';
import { FolderName } from '../../../components/FolderName';

export const AccessLogs = ({
  folderId,
  includeChildren,
}: {
  folderId: string;
  users?: MinimalSharedFolder[];
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

const Body = ({ folderId, userId, includeChildren }) => {
  const [result] = useQuery({
    query: accessLogQuery,
    variables: { folderId, userId, includeChildren, userType: UserType.Link },
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
  query AccessLogsQuery(
    $folderId: ID!
    $userId: ID
    $includeChildren: Boolean
    $userType: UserType
  ) {
    accessLogs(
      folderId: $folderId
      userId: $userId
      includeChildren: $includeChildren
      userType: $userType
    ) {
      id
      timestamp
      userId
      folderId
      ipAddress
      userAgent
      folder {
        ...FolderFragment
      }
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
    accessorKey: 'folder.name',
    header: 'Folder',
    minSize: 25,
    accessorFn: ({ folder }) => <FolderName folder={folder} />,
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
];

const UserAgent = ({ userAgent }: { userAgent: string }) => {
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
