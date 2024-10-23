import { Group, Tabs, Title } from '@mantine/core';
import { useNavigate, useParams } from 'react-router-dom';
import { ManageUsers } from './ManageUsers';
import { Page } from '../../components/Page';
import { ReactNode, Suspense } from 'react';
import { PicrLogo } from '../LoginForm';
import { ServerInfo } from './ServerInfo';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { InfoIcon, PublicLinkIcon, UserSettingsIcon } from '../../PicrIcons';
import { ManagePublicLinks } from './ManagePublicLinks';
import { useMe } from '../../hooks/useMe';
import { Tips } from '../../components/Tips';
import { TaskSummary } from '../../components/TaskSummary';

export const Settings = () => {
  const { tab } = useParams();
  const navigate = useNavigate();
  const me = useMe();

  const onTabChange = (newTab) => {
    navigate('/admin/settings/' + newTab);
  };

  return (
    <Page>
      <TopBar />
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
            <ManageUsers />
          </Suspense>
        </Tabs.Panel>
        <Tabs.Panel value="links">
          <Tips type="PublicLink" />
          <Suspense fallback={<LoadingIndicator />}>
            <ManagePublicLinks
              folder={me.folder}
              disableAddingLinks={true}
              relations="children"
            />
          </Suspense>
        </Tabs.Panel>
        <Tabs.Panel value="info">
          <Suspense fallback={<LoadingIndicator />}>
            <ServerInfo />
          </Suspense>
        </Tabs.Panel>
      </Tabs>
    </Page>
  );
};

const TopBar = () => {
  return (
    <Group pt="lg" pb="sm">
      <PicrLogo style={{ height: 32 }} />
      <Title>PICR Settings</Title>
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
  { title: 'Info', slug: 'info', icon: <InfoIcon /> },
];
