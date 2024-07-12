import { useQuery } from 'urql';
import { Suspense } from 'react';
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
import { ManageFolder } from './ManageFolder';
import { getUUID } from '../Router';
import { TaskSummary } from '../components/TaskSummary';
import { ViewSelector } from '../components/ViewSelector';
import { FilterToggle } from '../components/FilterToggle';
import { DownloadZipButton } from '../components/DownloadZipButton';
import { ActionIcon, Button, Group, Title } from '@mantine/core';
import { TbSettings } from 'react-icons/tb';
import { actionIconSize } from '../theme';

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
        <ViewFolderBody
          managing={managing}
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
  managing,
}: {
  folderId: string;
  managing: boolean;
  toggleManaging: () => void;
}) => {
  // const headers = useMemo(() => {
  //   return uuid ? { fetchOptions: { headers: { uuid } } } : undefined;
  // }, [uuid]);

  const [data, reQuery] = useQuery({
    query: viewFolderQuery,
    variables: { folderId },
    // context: headers,
  });
  const folder = data.data?.folder;
  const hasFiles = folder && folder.files.length > 0;
  const hasFolders = folder && folder.subFolders.length > 0;

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
        Manage Folder
      </Button>,
    );
  }
  if (hasFiles) {
    //   //it's crap UX if you can change the 'view' but there is nothing in there
    //   actions.push(
    //     <ViewSelector
    //       managing={managing}
    //       toggleManaging={toggleManaging}
    //       key="viewselector"
    //     />,
    //   );
    actions.push(<FilterToggle disabled={managing} key="filtertoggle" />);
  }
  if (hasFiles || hasFolders)
    actions.push(<DownloadZipButton folder={folder} key="downloadbutton" />); // TODO: option to not show this perhaps?

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
            <ManageFolder folderId={folderId} onClose={toggleManaging} />
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
