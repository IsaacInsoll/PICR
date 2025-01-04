import { Group, Tabs, Title } from '@mantine/core';
import { useNavigate, useParams } from 'react-router';
import { ManageUsers } from './ManageUsers';
import { Page } from '../../components/Page';
import { ReactNode, Suspense } from 'react';
import { PicrLogo } from '../LoginForm';
import { ServerInfo } from './ServerInfo';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import {
  AccessLogsIcon,
  BrandingIcon,
  InfoIcon,
  PublicLinkIcon,
  UserSettingsIcon,
} from '../../PicrIcons';
import { ManagePublicLinks } from './ManagePublicLinks';
import { useMe } from '../../hooks/useMe';
import { Tips } from '../../components/Tips';
import { TaskSummary } from '../../components/TaskSummary';
import { PicrTitle } from '../../components/PicrTitle';
import { QuickFind } from '../../components/QuickFind/QuickFind';
import { LoggedInHeader } from '../../components/Header/LoggedInHeader';
import { ManageBrandings } from './ManageBrandings';
import { AccessLogs } from './AccessLogs/AccessLogs';
import { TreeSize } from './treesize/TreeSize';

export const Settings = () => {
  const { tab } = useParams();
  const navigate = useNavigate();
  const me = useMe();

  const onTabChange = (newTab) => {
    navigate('/admin/settings/' + newTab);
  };

  const title = 'PICR Settings';

  return (
    <>
      <LoggedInHeader />
      <Page>
        <QuickFind folder={me.folder} />
        <TopBar title={title} />
        <TaskSummary folderId={me?.folderId} />
        <Tabs value={tab ?? 'users'} onChange={onTabChange} keepMounted={false}>
          <Tabs.List>
            {tabList.map(({ title, slug, icon }) => (
              <Tabs.Tab value={slug} leftSection={icon} key={slug}>
                {title}
              </Tabs.Tab>
            ))}
          </Tabs.List>
          <Tabs.Panel value="users">
            <Tips type="Users" />
            <Suspense fallback={<LoadingIndicator />}>
              <PicrTitle title={['Users', title]} />
              <ManageUsers />
            </Suspense>
          </Tabs.Panel>
          <Tabs.Panel value="links">
            <Tips type="PublicLink" />
            <Suspense fallback={<LoadingIndicator />}>
              <PicrTitle title={['Links', title]} />
              <ManagePublicLinks
                folder={me.folder}
                disableAddingLinks={true}
                relations="children"
              />
            </Suspense>
          </Tabs.Panel>
          <Tabs.Panel value="logs">
            <Tips type="Logs" />
            <Suspense fallback={<LoadingIndicator />}>
              <PicrTitle title={['Logs', title]} />
              <AccessLogs folderId={me?.folderId} includeChildren={true} />
            </Suspense>
          </Tabs.Panel>
          <Tabs.Panel value="branding">
            <Tips type="Branding" />
            <Suspense fallback={<LoadingIndicator />}>
              <PicrTitle title={['Branding', title]} />
              <ManageBrandings />
            </Suspense>
          </Tabs.Panel>
          <Tabs.Panel value="info">
            <Suspense fallback={<LoadingIndicator />}>
              <PicrTitle title={['Server Info', title]} />
              <ServerInfo />
            </Suspense>
          </Tabs.Panel>
          <Tabs.Panel value="treesize">
            <TreeSize rootId={me?.folderId} />
          </Tabs.Panel>
        </Tabs>
      </Page>
    </>
  );
};

const TopBar = ({ title }: { title: string }) => {
  return (
    <Group pt="lg" pb="sm">
      <PicrLogo style={{ height: 32 }} />
      <Title>{title}</Title>
      <PicrTitle title={title} />
    </Group>
  );
};

interface SettingsTab {
  icon: ReactNode;
  title: string;
  slug: string;
}

const tabList: SettingsTab[] = [
  { title: 'Users', slug: 'users', icon: <UserSettingsIcon /> },
  { title: 'Links', slug: 'links', icon: <PublicLinkIcon /> },
  { title: 'AccessLogs', slug: 'logs', icon: <AccessLogsIcon /> },
  { title: 'Branding', slug: 'branding', icon: <BrandingIcon /> },
  { title: 'Info', slug: 'info', icon: <InfoIcon /> },
];
