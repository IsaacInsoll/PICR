import { useQuery } from 'urql';
import { Suspense } from 'react';
import {
  FolderHeader,
  PlaceholderFolderHeader,
} from '../components/FolderHeader/FolderHeader';
import { MinimalFolder } from '../../types';
import { folderSubtitle } from '../helpers/folderSubtitle';
import { useNavigate, useParams } from 'react-router-dom';
import { viewFolderQuery } from '../queries/viewFolderQuery';
import { FolderListView } from '../components/FolderListView';
import { FileListView } from '../components/FileListView/FileListView';
import QueryFeedback from '../components/QueryFeedback';
import { useSetAtom } from 'jotai/index';
import { placeholderFolderName } from '../components/FolderHeader/PlaceholderFolderName';
import { Button } from 'grommet';

export const ViewFolder = () => {
  const navigate = useNavigate();
  let { folderId, fileId } = useParams();
  const setPlaceholderFolder = useSetAtom(placeholderFolderName);
  // const [folderId, setFolderId] = useState(rootFolderId);
  console.log('ViewFolder with ', folderId);
  const handleSetFolder = (f: MinimalFolder) => {
    setPlaceholderFolder(f?.name);
    navigate('./../' + f.id);
  };

  return (
    <>
      <Suspense fallback={<PlaceholderFolderHeader />}>
        <ViewFolderBody
          key={folderId ?? '1'}
          folderId={folderId ?? '1'}
          fileId={fileId}
          setFolder={handleSetFolder}
        />
      </Suspense>
    </>
  );
};

export const ViewFolderBody = ({
  folderId,
  fileId,
  setFolder,
}: {
  folderId: string;
  setFolder: (folder: MinimalFolder) => void;
  fileId?: string;
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
  const actions =
    folder?.permissions === 'Admin' ? (
      <Button primary label="Manage" />
    ) : undefined;
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
            actions={actions}
          />
          <FolderListView folders={folder?.subFolders} onClick={setFolder} />
          <FileListView files={folder.files} />
        </>
      )}
    </>
  );
};
