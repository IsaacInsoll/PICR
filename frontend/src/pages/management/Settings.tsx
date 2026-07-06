import { Tabs } from '@mantine/core';
import { useNavigate, useParams } from 'react-router';
import { Page } from '../../components/Page';
import type { ReactNode } from 'react';
import { lazy, Suspense } from 'react';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import {
  AccessLogsIcon,
  BrandingIcon,
  InfoIcon,
  PublicLinkIcon,
  UserSettingsIcon,
} from '../../PicrIcons';
import { useMe } from '../../hooks/useMe';
import { Tips } from '../../components/Tips';
import { TaskSummary } from '../../components/TaskSummary';
import { PicrTitle } from '../../components/PicrTitle';
import { QuickFind } from '../../components/QuickFind/QuickFind';
import { LoggedInHeader } from '../../components/Header/LoggedInHeader';
import { TopBar } from './TopBar';

const AccessLogs = lazy(() =>
  import('./AccessLogs/AccessLogs').then((module) => ({
    default: module.AccessLogs,
  })),
);
const ManageBrandings = lazy(() =>
  import('./ManageBrandings').then((module) => ({
    default: module.ManageBrandings,
  })),
);
const ManagePublicLinks = lazy(() =>
  import('./ManagePublicLinks').then((module) => ({
    default: module.ManagePublicLinks,
  })),
);
const ManageUsers = lazy(() =>
  import('./ManageUsers').then((module) => ({
    default: module.ManageUsers,
  })),
);
const ServerInfo = lazy(() =>
  import('./ServerInfo').then((module) => ({
    default: module.ServerInfo,
  })),
);
const TreeSize = lazy(() =>
  import('./treesize/TreeSize').then((module) => ({
    default: module.TreeSize,
  })),
);

export const Settings = () => {
  const { tab } = useParams();
  const navigate = useNavigate();
  const me = useMe();

  const onTabChange = (newTab: string | null) => {
    if (!newTab) return;
    void navigate('/admin/settings/' + newTab);
  };

  const title = 'PICR Settings';

  return (
    <>
      <LoggedInHeader />
      <Page>
        <QuickFind folder={me?.folder ?? undefined} />
        <TopBar title={title} />
        {me?.folderId ? <TaskSummary folderId={me.folderId} /> : null}
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
                folder={me?.folder ?? { id: me?.folderId ?? '1', name: 'Root' }}
                disableAddingLinks={true}
                relations="children"
              />
            </Suspense>
          </Tabs.Panel>
          <Tabs.Panel value="logs">
            <Tips type="Logs" />
            <Suspense fallback={<LoadingIndicator />}>
              <PicrTitle title={['Logs', title]} />
              {me?.folderId ? (
                <AccessLogs folderId={me.folderId} includeChildren={true} />
              ) : null}
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
            <Suspense fallback={<LoadingIndicator />}>
              {me?.folderId ? <TreeSize rootId={me.folderId} /> : null}
            </Suspense>
          </Tabs.Panel>
        </Tabs>
      </Page>
    </>
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
