import { useQuery } from 'urql';
import { Suspense, useCallback, useEffect } from 'react';
import {
  FolderHeader,
  PlaceholderFolderHeader,
} from '../components/FolderHeader/FolderHeader';
import { folderSubtitle } from '../helpers/folderSubtitle';
import { useNavigate, useParams } from 'react-router-dom';
import { viewFolderQuery } from '../urql/queries/viewFolderQuery';
import { SubfolderListView } from '../components/SubfolderListView';
import { FolderContentsView } from '../components/FileListView/FolderContentsView';
import QueryFeedback from '../components/QueryFeedback';
import { ManagePublicLinks } from './management/ManagePublicLinks';
import { TaskSummary } from '../components/TaskSummary';
import { FilterToggle } from '../components/FilterToggle';
import { DownloadZipButton } from '../components/DownloadZipButton';
import { Button, Group, Title } from '@mantine/core';
import { TbSettings } from 'react-icons/tb';
import { useSetFolder } from '../hooks/useSetFolder';
import { FolderModalManager } from '../components/FolderModalManager';
import { GenerateThumbnailsButton } from './GenerateThumbnailsButton';
import { Page } from '../components/Page';
import { useBaseViewFolderURL } from '../hooks/useBaseViewFolderURL';
import { QuickFind } from '../components/QuickFind/QuickFind';
import { useRequery } from '../hooks/useRequery';
import { LoggedInHeader } from '../components/Header/LoggedInHeader';
import { useIsMobile } from '../hooks/useIsMobile';
import { FileSortSelector } from '../components/FileListView/FileSortSelector';
import { FolderActivity } from './FolderActivity';

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

export const ViewFolderBody = () => {
  const navigate = useNavigate();
  const { folderId, fileId } = useParams();
  const baseUrl = useBaseViewFolderURL();
  const managing = fileId === 'manage';
  const activity = fileId === 'activity';
  const setFolder = useSetFolder();

  const [data, reQuery] = useQuery({
    query: viewFolderQuery,
    variables: { folderId },
  });

  useRequery(reQuery, 20000);

  const toggleManaging = useCallback(() => {
    navigate(baseUrl + folderId + (managing ? '' : '/manage'));
  }, [navigate, baseUrl, folderId, managing]);

  const folder = data.data?.folder;
  const hasFiles = folder && folder.files.length > 0;
  const hasFolders = folder && folder.subFolders.length > 0;

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

  if (hasFiles) {
    actions.push(<FileSortSelector />);
    actions.push(<FilterToggle disabled={managing} key="filtertoggle" />);
  }
  if (hasFiles || hasFolders)
    actions.push(
      <DownloadZipButton
        folder={folder}
        key="downloadbutton"
        disabled={managing}
      />,
    ); // TODO: option to not show this perhaps?

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
          {managing ? (
            <Page>
              <ManagePublicLinks
                folder={folder}
                onClose={toggleManaging}
                relations="options"
              >
                <GenerateThumbnailsButton folderId={folder.id} />
                <Button onClick={toggleManaging}>Close Settings</Button>
              </ManagePublicLinks>
            </Page>
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
        </>
      )}
    </>
  );
};
