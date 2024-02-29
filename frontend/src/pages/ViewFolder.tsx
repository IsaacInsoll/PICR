import { useQuery } from 'urql';
import { Suspense } from 'react';
import {
  FolderHeader,
  PlaceholderFolderHeader,
  placeholderFolderName,
} from '../components/FolderHeader';
import { MinimalFolder } from '../../types';
import { folderSubtitle } from '../helpers/folderSubtitle';
import { useNavigate, useParams } from 'react-router-dom';
import { viewFolderQuery } from '../helpers/viewFolderQuery';
import { FolderListView } from '../components/FolderListView';
import { FileListView } from '../components/FileListView/FileListView';
import QueryFeedback from '../components/QueryFeedback';
import { useSetAtom } from 'jotai/index';

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

const ViewFolderBody = ({
  folderId,
  setFolder,
}: {
  folderId: string;
  setFolder: (folder: MinimalFolder) => void;
}) => {
  const [data, reQuery] = useQuery({
    query: viewFolderQuery,
    variables: { folderId },
  });
  const folder = data.data?.folder;
  return (
    <>
      <QueryFeedback result={data} reQuery={reQuery} />
      {!folder ? (
        <h1>Folder Not Found</h1>
      ) : (
        <>
          <FolderHeader folder={folder} subtitle={folderSubtitle(folder)} />
          <FolderListView folders={folder?.subFolders} onClick={setFolder} />
          <FileListView files={folder.files} />
        </>
      )}
    </>
  );
};
