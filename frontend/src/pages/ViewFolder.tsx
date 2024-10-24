import { useQuery } from 'urql';
import { Suspense, useEffect } from 'react';
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
import { getUUID } from '../Router';
import { TaskSummary } from '../components/TaskSummary';
import { FilterToggle } from '../components/FilterToggle';
import { DownloadZipButton } from '../components/DownloadZipButton';
import { Button, Group, Title } from '@mantine/core';
import { TbSettings } from 'react-icons/tb';
import { useSetFolder } from '../hooks/useSetFolder';
import { ModalManager } from '../components/ModalManager';
import { GenerateThumbnailsButton } from './GenerateThumbnailsButton';
import { Page } from '../components/Page';

// This component is used in the 'public URL' and 'private URL' routes, so this is how we determine where each link should point
export const useBaseViewFolderURL = () => {
  return getUUID() ? '/s/' + getUUID() + '/' : '/admin/f/';
};

export const ViewFolder = () => {
  const navigate = useNavigate();
  const { folderId, fileId } = useParams();
  const baseUrl = useBaseViewFolderURL();
  const managing = fileId === 'manage';
  return (
    <>
      <Suspense fallback={<PlaceholderFolderHeader />}>
        <ModalManager />
        <ViewFolderBody
          toggleManaging={() =>
            navigate(baseUrl + folderId + (managing ? '' : '/manage'))
          }
          key={folderId ?? '1'}
          folderId={folderId ?? '1'}
        />
      </Suspense>
    </>
  );
};

export const ViewFolderBody = ({
  folderId,
  toggleManaging,
}: {
  folderId: string;
  toggleManaging: () => void;
}) => {
  const { fileId } = useParams();

  // const headers = useMemo(() => {
  //   return uuid ? { fetchOptions: { headers: { uuid } } } : undefined;
  // }, [uuid]);
  const managing = fileId === 'manage';

  const [data, reQuery] = useQuery({
    query: viewFolderQuery,
    variables: { folderId },
  });

  const setFolder = useSetFolder();

  const folder = data.data?.folder;
  const hasFiles = folder && folder.files.length > 0;
  const hasFolders = folder && folder.subFolders.length > 0;

  // redirect to 'no file selected' if you are in a valid folder but the file isn't found
  useEffect(() => {
    const fileIds = folder?.files.map((f) => f.id);
    if (fileId && fileIds && fileIds.length > 0 && !managing) {
      if (!fileIds.includes(fileId)) {
        console.log('File not found in folder, redirecting to folder');
        setFolder(folder);
      }
    }
  }, [folderId, fileId, managing]);

  const actions = [];
  if (folder?.permissions === 'Admin') {
    actions.push(
      <Button
        key="manage"
        variant={managing ? 'filled' : 'default'}
        title={managing ? 'View Folder' : 'Manage'}
        onClick={toggleManaging}
        leftSection={<TbSettings />}
      >
        Manage
      </Button>,
    );
  }
  if (hasFiles) {
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
                <GenerateThumbnailsButton folder={folder} />
                <Button onClick={toggleManaging}>Close Settings</Button>
              </ManagePublicLinks>
            </Page>
          ) : (
            <>
              <SubfolderListView folder={folder} />
              <FolderContentsView folderId={folderId} files={folder.files} />
            </>
          )}
        </>
      )}
    </>
  );
};
