import { Tabs } from '@mantine/core';
import { useLocation, useNavigate, useParams } from 'react-router';
import { Page } from '../../components/Page';
import type { ReactNode } from 'react';
import { lazy, Suspense } from 'react';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import {
  AccessLogsIcon,
  BrandingIcon,
  InfoIcon,
  PublicLinkIcon,
  StorageIcon,
  UserSettingsIcon,
  VideoMetadataIcon,
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
const MediaSettings = lazy(() =>
  import('./ServerInfo').then((module) => ({
    default: module.MediaSettings,
  })),
);
const StorageSettings = lazy(() =>
  import('./ServerInfo').then((module) => ({
    default: module.StorageSettings,
  })),
);
const TreeSize = lazy(() =>
  import('./treesize/TreeSize').then((module) => ({
    default: module.TreeSize,
  })),
);

export const Settings = () => {
  const { tab, slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const me = useMe();
  const activeTab = tab ?? 'info';

  const onTabChange = (newTab: string | null) => {
    if (!newTab) return;
    void navigate(settingsPath(newTab));
  };

  const selectedSlugFor = (targetTab: SettingsRouteTab) =>
    activeTab === targetTab ? (slug ?? null) : null;

  const openSelectedItem = (targetTab: SettingsRouteTab, itemSlug: string) => {
    void navigate(settingsPath(targetTab, itemSlug), {
      state: {
        settingsSelection: { tab: targetTab, slug: itemSlug },
      } satisfies SettingsSelectionLocationState,
    });
  };

  const closeSelectedItem = (
    targetTab: SettingsRouteTab,
    itemSlug: string | null,
  ) => {
    const state = location.state as SettingsSelectionLocationState | null;

    if (
      itemSlug &&
      state?.settingsSelection?.tab === targetTab &&
      state.settingsSelection.slug === itemSlug
    ) {
      void navigate(-1);
      return;
    }

    void navigate(settingsPath(targetTab), { replace: true });
  };

  const title = 'PICR Settings';
  const selectedUserSlug = selectedSlugFor('users');
  const selectedLinkSlug = selectedSlugFor('links');
  const selectedBrandingSlug = selectedSlugFor('branding');
  const selectedLogUserSlug = selectedSlugFor('logs');

  return (
    <>
      <LoggedInHeader />
      <Page>
        <QuickFind folder={me?.folder ?? undefined} />
        <TopBar title={title} />
        {me?.folderId ? <TaskSummary folderId={me.folderId} /> : null}
        <Tabs value={activeTab} onChange={onTabChange} keepMounted={false}>
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
              <ManageUsers
                selectedUserId={selectedUserSlug}
                onSelectUser={(id) => openSelectedItem('users', id)}
                onCreateUser={() => openSelectedItem('users', NEW_ITEM_SLUG)}
                onCloseUser={() => closeSelectedItem('users', selectedUserSlug)}
              />
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
                selectedLinkId={
                  selectedLinkSlug === NEW_ITEM_SLUG ? null : selectedLinkSlug
                }
                onSelectLink={(id) => openSelectedItem('links', id)}
                onCloseLink={() => closeSelectedItem('links', selectedLinkSlug)}
              />
            </Suspense>
          </Tabs.Panel>
          <Tabs.Panel value="logs">
            <Tips type="Logs" />
            <Suspense fallback={<LoadingIndicator />}>
              <PicrTitle title={['Logs', title]} />
              {me?.folderId ? (
                <AccessLogs
                  folderId={me.folderId}
                  includeChildren={true}
                  selectedUserId={selectedLogUserSlug ?? undefined}
                  onSelectUserId={(userId) =>
                    userId
                      ? openSelectedItem('logs', userId)
                      : closeSelectedItem('logs', selectedLogUserSlug)
                  }
                />
              ) : null}
            </Suspense>
          </Tabs.Panel>
          <Tabs.Panel value="branding">
            <Tips type="Branding" />
            <Suspense fallback={<LoadingIndicator />}>
              <PicrTitle title={['Branding', title]} />
              <ManageBrandings
                selectedBrandingId={selectedBrandingSlug}
                onSelectBranding={(id) => openSelectedItem('branding', id)}
                onCreateBranding={() =>
                  openSelectedItem('branding', NEW_ITEM_SLUG)
                }
                onCloseBranding={() =>
                  closeSelectedItem('branding', selectedBrandingSlug)
                }
              />
            </Suspense>
          </Tabs.Panel>
          <Tabs.Panel value="info">
            <Suspense fallback={<LoadingIndicator />}>
              <PicrTitle title={['Server Info', title]} />
              <ServerInfo />
            </Suspense>
          </Tabs.Panel>
          <Tabs.Panel value="media">
            <Suspense fallback={<LoadingIndicator />}>
              <PicrTitle title={['Media', title]} />
              <MediaSettings />
            </Suspense>
          </Tabs.Panel>
          <Tabs.Panel value="storage">
            <Suspense fallback={<LoadingIndicator />}>
              <PicrTitle title={['Storage', title]} />
              <StorageSettings />
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

const NEW_ITEM_SLUG = 'new';

type SettingsRouteTab = 'users' | 'links' | 'branding' | 'logs';

interface SettingsSelectionLocationState {
  settingsSelection?: {
    tab: SettingsRouteTab;
    slug: string;
  };
}

const settingsPath = (tab: string, slug?: string) =>
  slug ? `/admin/settings/${tab}/${slug}` : `/admin/settings/${tab}`;

interface SettingsTab {
  icon: ReactNode;
  title: string;
  slug: string;
}

const tabList: SettingsTab[] = [
  { title: 'Info', slug: 'info', icon: <InfoIcon /> },
  { title: 'Media', slug: 'media', icon: <VideoMetadataIcon /> },
  { title: 'Storage', slug: 'storage', icon: <StorageIcon /> },
  { title: 'Users', slug: 'users', icon: <UserSettingsIcon /> },
  { title: 'Links', slug: 'links', icon: <PublicLinkIcon /> },
  { title: 'Branding', slug: 'branding', icon: <BrandingIcon /> },
  { title: 'Logs', slug: 'logs', icon: <AccessLogsIcon /> },
];
