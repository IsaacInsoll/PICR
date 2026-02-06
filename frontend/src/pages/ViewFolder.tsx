import { useQuery } from 'urql';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import {
  FolderHeader,
  PlaceholderFolderHeader,
} from '../components/FolderHeader/FolderHeader';
import { folderSubtitle } from '../helpers/folderSubtitle';
import { useNavigate, useParams } from 'react-router';
import { viewFolderQuery } from '@shared/urql/queries/viewFolderQuery';
import { FolderContentsView } from '../components/FileListView/FolderContentsView';
import QueryFeedback from '../components/QueryFeedback';
import { TaskSummary } from '../components/TaskSummary';
import { ActionIcon, Button, Center, Group, Menu, Title } from '@mantine/core';
import { useSetFolder } from '../hooks/useSetFolder';
import { FolderModalManager } from '../components/FolderModalManager';
import { Page } from '../components/Page';
import { useBaseViewFolderURL } from '../hooks/useBaseViewFolderURL';
import { QuickFind } from '../components/QuickFind/QuickFind';
import { useRequery } from '@shared/hooks/useRequery';
import { LoggedInHeader } from '../components/Header/LoggedInHeader';
import { FileSortSelector } from '../components/FileListView/FileSortSelector';
import { FolderActivity } from './FolderActivity';
import { useCommentPermissions } from '../hooks/useCommentPermissions';
import { useSetAtom } from 'jotai';
import { MinimalFolder } from '../../types';
import { CommentIcon, DotsIcon, FilterIcon, FolderIcon } from '../PicrIcons';
import { FolderRouteParams } from '../Router';
import { filterAtom } from '@shared/filterAtom';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { applyBrandingDefaults, themeModeAtom } from '../atoms/themeModeAtom';
import { ManageFolder } from './ManageFolder';
import { FolderMenuItems } from '../components/FileListView/FolderMenu';
import { FolderCsvExportModal } from '../components/FileListView/FolderCsvExportModal';
import { useMe } from '../hooks/useMe';

type ViewFolderMode = 'files' | 'manage' | 'activity';

export const ViewFolder = () => {
  const { folderId } = useParams();

  return (
    <>
      <Suspense fallback={<PlaceholderFolderHeader />}>
        <ViewFolderBody key={folderId ?? '1'} folderId={folderId ?? '1'} />
      </Suspense>
    </>
  );
};

const ViewFolderBody = () => {
  const navigate = useNavigate();
  const { folderId, fileId } = useParams<FolderRouteParams>();
  const baseUrl = useBaseViewFolderURL();
  const setFolder = useSetFolder();
  const setThemeMode = useSetAtom(themeModeAtom);
  const [csvExportOpen, setCsvExportOpen] = useState(false);

  const mode: ViewFolderMode = ['manage', 'activity'].includes(fileId)
    ? fileId
    : 'files';
  const managing = mode === 'manage';
  const activity = mode === 'activity';

  const [data, reQuery] = useQuery({
    query: viewFolderQuery,
    variables: { folderId },
  });
  useRequery(reQuery, 20000);

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
    console.log('viewfolder setThemeMode effect');
    setThemeMode(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandingKey]);

  const toggleManaging = useCallback(() => {
    navigate(baseUrl + folderId + (managing ? '' : '/manage'));
  }, [navigate, baseUrl, folderId, managing]);

  const folder = data.data?.folder;
  const hasFiles = folder && folder.files.length > 0;

  // redirect to 'no file selected' if you are in a valid folder but the file isn't found
  useEffect(() => {
    const fileIds = folder?.files.map((f) => f.id);
    if (fileId && fileIds && fileIds.length > 0 && !managing && !activity) {
      if (!fileIds.includes(fileId)) {
        console.log('File not found in folder, redirecting to folder');
        setFolder(folder);
      }
    }
  }, [folderId, fileId, managing]);

  const actions = [];

  if (hasFiles && mode === 'files') {
    actions.push(<FileSortSelector key="FileSortSelector" />);
    // actions.push(<FilterToggle disabled={managing} key="filtertoggle" />);
  }

  if (mode === 'files') {
    actions.push(
      <FolderOverflowMenu
        folder={folder}
        key="Overflow"
        onCsvExport={() => setCsvExportOpen(true)}
      />,
    );
  } else {
    actions.push(
      <Button
        variant="default"
        onClick={() => setFolder(folder)}
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
      <FolderModalManager folder={folder} />
      <FolderCsvExportModal
        folder={folder}
        opened={csvExportOpen}
        onClose={() => setCsvExportOpen(false)}
      />
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
            {managing ? (
              <ManageFolder folder={folder} toggleManaging={toggleManaging} />
            ) : null}
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
  folder: MinimalFolder;
  onCsvExport: () => void;
}) => {
  const setFolder = useSetFolder();
  const setFiltering = useSetAtom(filterAtom);
  const { canView } = useCommentPermissions();
  const me = useMe();
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
