import { useNavigate, useParams } from 'react-router-dom';
import { ViewFolderBody } from './ViewFolder';
import { PlaceholderFolderHeader } from '../components/FolderHeader/FolderHeader';
import { Suspense } from 'react';

export const ViewPublicFolder = () => {
  const navigate = useNavigate();
  let { folderId, uuid } = useParams();
  console.log([folderId, uuid]);
  return (
    <>
      {folderId && (
        <Suspense fallback={<PlaceholderFolderHeader />}>
          <ViewFolderBody folderId={folderId} setFolder={nothing} uuid={uuid} />
        </Suspense>
      )}
    </>
  );
};

const nothing = () => {};
