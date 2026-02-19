import { useQuery } from 'urql';
import { Suspense, useEffect, useMemo, useState } from 'react';
import {
  FolderHeader,
  PlaceholderFolderHeader,
} from '../components/FolderHeader/FolderHeader';
import { folderSubtitle } from '../helpers/folderSubtitle';
import { useParams } from 'react-router';
import { viewFolderQuery } from '@shared/urql/queries/viewFolderQuery';
import { FolderContentsView } from '../components/FileListView/FolderContentsView';
import QueryFeedback from '../components/QueryFeedback';
import { TaskSummary } from '../components/TaskSummary';
import { ActionIcon, Button, Center, Group, Menu, Title } from '@mantine/core';
import { useSetFolder } from '../hooks/useSetFolder';
import { FolderModalManager } from '../components/FolderModalManager';
import { Page } from '../components/Page';
import { QuickFind } from '../components/QuickFind/QuickFind';
import { useRequery } from '@shared/hooks/useRequery';
import { LoggedInHeader } from '../components/Header/LoggedInHeader';
import { FileSortSelector } from '../components/FileListView/FileSortSelector';
import { FolderActivity } from './FolderActivity';
import { useSetAtom } from 'jotai';
import { PicrFolder } from '../../types';
import { DotsIcon, FilterIcon, FolderIcon } from '../PicrIcons';
import { filterAtom } from '@shared/filterAtom';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { applyBrandingDefaults, themeModeAtom } from '../atoms/themeModeAtom';
import { ManageFolder } from './ManageFolder';
import { FolderMenuItems } from '../components/FileListView/FolderMenu';
import { FolderCsvExportModal } from '../components/FileListView/FolderCsvExportModal';

type ViewFolderMode = 'files' | 'manage' | 'activity';

export const ViewFolder = () => {
  const { folderId } = useParams();

  return (
    <>
      <Suspense fallback={<PlaceholderFolderHeader />}>
        <ViewFolderBody key={folderId ?? '1'} />
      </Suspense>
    </>
  );
};

const ViewFolderBody = () => {
  const { folderId, fileId } = useParams();
  const setFolder = useSetFolder();
  const setThemeMode = useSetAtom(themeModeAtom);
  const [csvExportOpen, setCsvExportOpen] = useState(false);

  const mode: ViewFolderMode = ['manage', 'activity'].includes(fileId ?? '')
    ? (fileId as ViewFolderMode)
    : 'files';
  const managing = mode === 'manage';
  const activity = mode === 'activity';

  const [data, reQuery] = useQuery({
    query: viewFolderQuery,
    variables: { folderId: folderId ?? '1' },
  });
  useRequery(reQuery as Parameters<typeof useRequery>[0], 20000);

  const branding = data?.data?.folder?.branding;
  // Create a stable key from the branding values to avoid re-running effect on object reference changes
  const brandingKey = branding
    ? `${branding.id}-${branding.mode}-${branding.primaryColor}-${branding.headingFontKey}`
    : 'default';
  const theme = useMemo(
    () => applyBrandingDefaults(branding),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [brandingKey],
  );

  useEffect(() => {
    setThemeMode(theme);
  }, [setThemeMode, theme]);

  const folder = data.data?.folder;
  const hasFiles = folder && folder.files.length > 0;

  // redirect to 'no file selected' if you are in a valid folder but the file isn't found
  useEffect(() => {
    const fileIds = folder?.files?.map((f) => f.id) ?? [];
    if (fileId && fileIds && fileIds.length > 0 && !managing && !activity) {
      if (!fileIds.includes(fileId)) {
        if (folder) setFolder(folder);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally omitting folder/setFolder to avoid spurious redirects on query refresh
  }, [activity, fileId, managing]);

  const actions = [];

  if (hasFiles && mode === 'files') {
    actions.push(<FileSortSelector key="FileSortSelector" />);
    // actions.push(<FilterToggle disabled={managing} key="filtertoggle" />);
  }

  if (mode === 'files') {
    actions.push(
      folder ? (
        <FolderOverflowMenu
          folder={folder}
          key="Overflow"
          onCsvExport={() => setCsvExportOpen(true)}
        />
      ) : null,
    );
  } else {
    actions.push(
      <Button
        variant="default"
        onClick={() => {
          if (folder) setFolder(folder);
        }}
        leftSection={<FolderIcon />}
        key="BackToFolder"
      >
        Back to folder
      </Button>,
    );
  }

  // if (hasFiles || hasFolders)
  //   actions.push(
  //     <DownloadZipButton
  //       folder={folder}
  //       key="downloadbutton"
  //       disabled={managing}
  //     />,
  //   );

  return (
    <>
      <LoggedInHeader folder={folder} managing={managing} />
      <QuickFind folder={folder} />
      {folder ? <FolderModalManager folder={folder} /> : null}
      {folder ? (
        <FolderCsvExportModal
          folder={folder}
          opened={csvExportOpen}
          onClose={() => setCsvExportOpen(false)}
        />
      ) : null}
      <QueryFeedback result={data} reQuery={reQuery} />
      {!folder ? (
        <Title order={1}>Folder Not Found</Title>
      ) : (
        <>
          <FolderHeader
            folder={folder}
            customSubtitle={folder.subtitle ?? undefined}
            subtitle={folderSubtitle(folder)}
            actions={<Group>{actions}</Group>}
          />
          <TaskSummary folderId={folder.id} />
          <Suspense
            fallback={
              <Page>
                <Center>
                  <LoadingIndicator />
                </Center>
              </Page>
            }
          >
            {managing ? <ManageFolder folder={folder} /> : null}
            {activity ? (
              <Page>
                <FolderActivity folderId={folder.id} />
              </Page>
            ) : null}
            {!managing && !activity ? (
              <>
                {/*<SubfolderListView folder={folder} />*/}
                <FolderContentsView folder={folder} />
              </>
            ) : null}
          </Suspense>
        </>
      )}
    </>
  );
};

const FolderOverflowMenu = ({
  folder,
  onCsvExport,
}: {
  folder: PicrFolder;
  onCsvExport: () => void;
}) => {
  const setFiltering = useSetAtom(filterAtom);
  return (
    <Menu
      shadow="md"
      width={200}
      openDelay={0}
      trigger="hover"
      position="bottom-end"
    >
      <Menu.Target>
        <ActionIcon variant="default" color="gray" size="lg">
          <DotsIcon />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>{folder?.name}</Menu.Label>
        <Menu.Item
          leftSection={<FilterIcon />}
          onClick={() => setFiltering(true)}
        >
          Filter Files
        </Menu.Item>

        <FolderMenuItems
          folder={folder}
          showOpenItem={false}
          onCsvExport={onCsvExport}
        />

        {/*<Menu.Label>PICR</Menu.Label>*/}
        {/*<Menu.Item*/}
        {/*  leftSection={<UserSettingsIcon />}*/}
        {/*  onClick={() => navigate('/admin/settings')}*/}
        {/*>*/}
        {/*  Settings*/}
        {/*</Menu.Item>*/}
        {/*<Menu.Item leftSection={<LogOutIcon />} onClick={logOut}>*/}
        {/*  Log out*/}
        {/*</Menu.Item>*/}
      </Menu.Dropdown>
    </Menu>
  );
};
