import { Anchor } from 'grommet';
import { useQuery } from 'urql';
import { viewMinimumFolderQuery } from '../helpers/viewFolderQuery';
import { useNavigate } from 'react-router-dom';

export const FolderLink = ({ folderId }: { folderId?: string }) => {
  const navigate = useNavigate();
  console.log('<FolderLink> for ', folderId);
  const [data] = useQuery({
    query: viewMinimumFolderQuery,
    variables: { folderId: folderId ?? '0' },
    pause: !folderId,
  });
  if (!folderId) return undefined;
  const folder = data.data?.folder;
  return (
    <Anchor
      label={folder?.name}
      onClick={() => navigate('./../' + folder?.id)}
    />
  );
};