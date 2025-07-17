import { useQuery } from 'urql';
import { Suspense, useCallback, useEffect } from 'react';
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
import { useRequery } from '../hooks/useRequery';
import { LoggedInHeader } from '../components/Header/LoggedInHeader';
import { FileSortSelector } from '../components/FileListView/FileSortSelector';
import { FolderActivity } from './FolderActivity';
import { useCommentPermissions } from '../hooks/useCommentPermissions';
import { MinimalFolder } from '../../types';
import {
  CommentIcon,
  DotsIcon,
  DownloadIcon,
  FilterIcon,
  FolderIcon,
} from '../PicrIcons';
import { FolderRouteParams } from '../Router';
import { useGenerateZip } from '../hooks/useGenerateZip';
import { useSetAtom } from 'jotai/index';
import { filterAtom } from '../atoms/filterAtom';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { defaultBranding, themeModeAtom } from '../atoms/themeModeAtom';
import { Branding } from '../../../graphql-types';
import { ManageFolder } from './ManageFolder';

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

  const mode: ViewFolderMode = ['manage', 'activity'].includes(fileId)
    ? fileId
    : 'files';
  const managing = mode == 'manage';
  const activity = mode === 'activity';

  const [data, reQuery] = useQuery({
    query: viewFolderQuery,
    variables: { folderId },
  });
  useRequery(reQuery, 20000);

  useEffect(() => {
    const theme: Branding = {
      ...defaultBranding,
      ...data?.data?.folder?.branding,
    };
    setThemeMode(theme);
  }, [data?.data?.folder?.branding, setThemeMode]);

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

  if (hasFiles && mode == 'files') {
    actions.push(<FileSortSelector key="FileSortSelector" />);
    // actions.push(<FilterToggle disabled={managing} key="filtertoggle" />);
  }

  if (mode === 'files') {
    actions.push(<FolderOverflowMenu folder={folder} key="Overflow" />);
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
      <QueryFeedback result={data} reQuery={reQuery} />
      {!folder ? (
        <Title order={1}>Folder Not Found</Title>
      ) : (
        <>
          <FolderHeader
            folder={folder}
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

const FolderOverflowMenu = ({ folder }: { folder: MinimalFolder }) => {
  const setFolder = useSetFolder();
  const setFiltering = useSetAtom(filterAtom);
  const generateZip = useGenerateZip(folder, () => setTempDisabled(false));

  const { canView } = useCommentPermissions();
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
        <Menu.Item leftSection={<DownloadIcon />} onClick={generateZip}>
          Download ZIP
        </Menu.Item>
        {canView ? (
          <>
            <Menu.Label>Comments & Ratings</Menu.Label>
            <Menu.Item
              leftSection={<CommentIcon />}
              onClick={() => setFolder(folder, 'activity')}
            >
              View Activity
            </Menu.Item>
          </>
        ) : null}
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
