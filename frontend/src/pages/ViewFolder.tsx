import { useQuery } from 'urql';
import { Suspense } from 'react';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { FolderHeader } from '../components/FolderHeader';
import { MinimalFolder } from '../../types';
import { folderSubtitle } from '../helpers/folderSubtitle';
import { useNavigate, useParams } from 'react-router-dom';
import { viewFolderQuery } from '../helpers/viewFolderQuery';
import { FolderListView } from '../components/FolderListView';
import { FileListView } from '../components/FileListView/FileListView';

// You can't navigate above rootFolderId (IE: if viewing a shared link you can't get to parents of that)
export const ViewFolder = ({ rootFolderId }: { rootFolderId: string }) => {
  const navigate = useNavigate();
  let { folderId } = useParams();
  // const [folderId, setFolderId] = useState(rootFolderId);

  console.log('ViewFolder', folderId, rootFolderId);
  return (
    <Suspense fallback={<LoadingIndicator />}>
      <ViewFolderBody
        folderId={folderId ?? '1'}
        setFolder={(f) => navigate('./../' + f.id)}
      />
    </Suspense>
  );
};

const ViewFolderBody = ({
  folderId,
  setFolder,
}: {
  folderId: string;
  setFolder: (folder: MinimalFolder) => void;
}) => {
  const [data] = useQuery({
    query: viewFolderQuery,
    variables: { folderId },
  });
  const folder = data.data?.folder;
  if (!folder) return <h1>Folder not found</h1>;
  return (
    <>
      <FolderHeader folder={folder} subtitle={folderSubtitle(folder)} />
      {folder?.subFolders?.length > 0 ? (
        <FolderListView folders={folder?.subFolders} onClick={setFolder} />
      ) : null}
      {folder.files?.length > 0 ? <FileListView files={folder.files} /> : null}
    </>
  );
};
