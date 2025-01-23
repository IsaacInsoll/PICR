import { LoggedInHeader } from '../components/Header/LoggedInHeader';
import { QuickFind } from '../components/QuickFind/QuickFind';
import { TaskSummary } from '../components/TaskSummary';
import { Page } from '../components/Page';
import { useMe } from '../hooks/useMe';
import { TopBar } from './management/TopBar';
import { Box, Divider, Grid, Group, Paper, Stack, Title } from '@mantine/core';
import { ReactNode } from 'react';
import { AccessLogsIcon, FileIcon, FolderIcon } from '../PicrIcons';

export const Dashboard = () => {
  const me = useMe();
  return (
    <>
      <LoggedInHeader />
      <Page>
        <QuickFind folder={me?.folder} />
        <TopBar title="Welcome to PICR" />
        <TaskSummary folderId={me?.folderId} />
        <Body />
      </Page>
    </>
  );
};

const Body = () => {
  const gs = 6; //grid size
  return (
    <Grid>
      <BodyComponent title="Recent AccessLogs" icon={<AccessLogsIcon />}>
        Only list each user once by most recent desc
      </BodyComponent>

      <BodyComponent title="Recent Viewed Folders" icon={<FolderIcon />}>
        Folders I personally recently viewed
      </BodyComponent>
      <BodyComponent title="Recent Folders Created" icon={<FolderIcon />}>
        Folders recently created
      </BodyComponent>
      <BodyComponent title="Recent Files Created" icon={<FileIcon />}>
        Files recently created or modified???
      </BodyComponent>
    </Grid>
  );
};

const BodyComponent = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) => {
  return (
    <Grid.Col span={6}>
      <Paper shadow="xs" p="xl">
        <Stack gap="xs">
          <Title order={4} style={{ opacity: 0.33 }}>
            <Group>
              {icon} {title}
            </Group>
          </Title>
          <Divider />
          <Box>{children}</Box>
        </Stack>
      </Paper>
    </Grid.Col>
  );
};
