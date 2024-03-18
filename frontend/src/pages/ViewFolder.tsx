import { useQuery } from 'urql';
import { Suspense } from 'react';
import {
  FolderHeader,
  PlaceholderFolderHeader,
} from '../components/FolderHeader/FolderHeader';
import { MinimalFolder } from '../../types';
import { folderSubtitle } from '../helpers/folderSubtitle';
import { useNavigate, useParams } from 'react-router-dom';
import { viewFolderQuery } from '../urql/queries/viewFolderQuery';
import { FolderListView } from '../components/FolderListView';
import { FileListView } from '../components/FileListView/FileListView';
import QueryFeedback from '../components/QueryFeedback';
import { useSetAtom } from 'jotai/index';
import { placeholderFolderName } from '../components/FolderHeader/PlaceholderFolderName';
import { Button } from 'grommet';
import { ManageFolder } from './ManageFolder';
import { getUUID } from '../Router';
import { TaskSummary } from '../components/TaskSummary';

// This component is used in the 'public URL' and 'private URL' routes, so this is how we determine where each link should point
export const useBaseViewFolderURL = () => {
  return getUUID() ? '/s/' + getUUID() + '/' : '/admin/f/';
};

export const ViewFolder = () => {
  const navigate = useNavigate();
  let { folderId, fileId } = useParams();
  const baseUrl = useBaseViewFolderURL();
  const setPlaceholderFolder = useSetAtom(placeholderFolderName);
  const managing = fileId === 'manage';
  const handleSetFolder = (f: MinimalFolder) => {
    setPlaceholderFolder(f?.name);
    navigate(baseUrl + f.id);
  };

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
          setFolder={handleSetFolder}
        />
      </Suspense>
    </>
  );
};

export const ViewFolderBody = ({
  folderId,
  setFolder,
  toggleManaging,
  managing,
}: {
  folderId: string;
  managing: boolean;
  setFolder: (folder: MinimalFolder) => void;
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
  const actions = [];
  if (folder?.permissions === 'Admin') {
    actions.push(
      <Button
        primary
        label={managing ? 'View Folder' : 'Manage'}
        onClick={toggleManaging}
        key={1}
      />,
    );
  }

  return (
    <>
      <QueryFeedback result={data} reQuery={reQuery} />
      {!folder ? (
        <h1>Folder Not Found</h1>
      ) : (
        <>
          <FolderHeader
            folder={folder}
            subtitle={folderSubtitle(folder)}
            actions={<>{actions}</>}
          />
          <TaskSummary folderId={folder.id} />
          {managing ? (
            <ManageFolder folderId={folderId} />
          ) : (
            <>
              <FolderListView
                folders={folder?.subFolders}
                onClick={setFolder}
              />
              <FileListView folderId={folderId} files={folder.files} />
            </>
          )}
        </>
      )}
    </>
  );
};
