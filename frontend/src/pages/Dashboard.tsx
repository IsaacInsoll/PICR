import { LoggedInHeader } from '../components/Header/LoggedInHeader';
import { QuickFind } from '../components/QuickFind/QuickFind';
import { TaskSummary } from '../components/TaskSummary';
import { Page } from '../components/Page';
import { useMe } from '../hooks/useMe';
import { TopBar } from './management/TopBar';
import {
  Box,
  Divider,
  Grid,
  Group,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { ReactNode, Suspense } from 'react';
import { AccessLogsIcon, FolderIcon } from '../PicrIcons';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { useQuery } from 'urql';
import { FolderName } from '../components/FolderName';
import { DateDisplay } from '../components/FileListView/Filtering/PrettyDate';
import { PicrAvatar } from '../components/PicrAvatar';
import { useIsMobile } from '../hooks/useIsMobile';
import { PicrLink } from '../components/PicrLink';
import { EmptyPlaceholder } from './EmptyPlaceholder';
import { TbUnlink } from 'react-icons/tb';
import { readAllFoldersQuery } from '../urql/queries/readAllFoldersQuery';
import { FoldersSortType } from '../gql/graphql';
import { ManageFolderIconButton } from '../components/ManageFolderButton';
import { recentUsersQuery } from '../urql/queries/recentUsersQuery';

export const Dashboard = () => {
  const me = useMe();
  return (
    <>
      <LoggedInHeader />
      <Page>
        <QuickFind folder={me?.folder} />
        <TopBar title="PICR Media Delivery" />
        <TaskSummary folderId={me?.folderId} />
        <Body />
      </Page>
    </>
  );
};

const Body = () => {
  return (
    <>
      {/*<Tips type="Dashboard" />*/}
      <Grid>
        <BodyComponent
          title="Recent Clients"
          icon={<AccessLogsIcon />}
          link="/admin/settings/logs"
        >
          <RecentUsers />
        </BodyComponent>

        {/*<BodyComponent title="Recent Viewed Folders" icon={<FolderIcon />}>*/}
        {/*  Folders I personally recently viewed*/}
        {/*</BodyComponent>*/}
        <BodyComponent title="Recently Modified Folders" icon={<FolderIcon />}>
          <RecentlyModifiedFolders />
        </BodyComponent>
        {/*<BodyComponent title="Recent Files Created" icon={<FileIcon />}>*/}
        {/*  Files recently created or modified???*/}
        {/*</BodyComponent>*/}
      </Grid>
    </>
  );
};

const RecentUsers = () => {
  const me = useMe();
  const mobile = useIsMobile();
  const [result] = useQuery({
    query: recentUsersQuery,
    variables: { folderId: me?.folderId },
  });
  if (result.data?.users.length == 0)
    return (
      <EmptyPlaceholder
        text="No public links have been used (yet!)"
        icon={<TbUnlink />}
      />
    );
  return (
    <Table width="100%">
      <Table.Tbody>
        {result.data?.users.map((user) => (
          <Table.Tr key={user.id}>
            <Table.Td>
              <DateDisplay dateString={user.lastAccess} />
            </Table.Td>
            <Table.Td>
              <Group>
                <PicrAvatar user={user} size="sm" />
                {user.name}
              </Group>
            </Table.Td>
            {!mobile ? (
              <Table.Td>
                <FolderName folder={user.folder} />
              </Table.Td>
            ) : null}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
};

const BodyComponent = ({
  title,
  link,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  link?: string;
  children: ReactNode;
}) => {
  return (
    <Stack gap="xs" pt="md" pb="lg" w="100%">
      <Title order={4} style={{ opacity: 0.33 }}>
        <Group align="center">
          {icon}
          <Text style={{ flexGrow: 1 }}>{title}</Text>
          {link ? (
            <PicrLink to={link}>
              <Text size="xs">View All</Text>
            </PicrLink>
          ) : null}
        </Group>
      </Title>
      <Divider />
      <Box>
        <Suspense fallback={<LoadingIndicator />}>{children}</Suspense>
      </Box>
    </Stack>
  );
};

const RecentlyModifiedFolders = () => {
  const me = useMe();

  const [result] = useQuery({
    query: readAllFoldersQuery,
    variables: {
      id: me?.folderId,
      limit: 10,
      sort: FoldersSortType.FolderLastModified,
    },
  });

  return (
    <Table width="100%">
      <Table.Tbody>
        {result.data?.allFolders.map((f) => (
          <Table.Tr key={f.id}>
            <Table.Td>
              <DateDisplay dateString={f?.folderLastModified} />
            </Table.Td>
            <Table.Td>
              <FolderName folder={f} />
            </Table.Td>
            <Table.Td align="right">
              <ManageFolderIconButton folder={f} />
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
};
