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

// You can't navigate above rootFolderId (IE: if viewing a shared link you can't get to parents of that)
export const ViewFolder = ({ rootFolderId }: { rootFolderId: string }) => {
  const navigate = useNavigate();
  let { folderId } = useParams();
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
          setFolder={handleSetFolder}
        />
      </Suspense>
    </>
  );
};

export const ViewFolderBody = ({
  folderId,
  setFolder,
  uuid,
}: {
  folderId: string;
  setFolder: (folder: MinimalFolder) => void;
  uuid?: string;
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
