import { Anchor } from 'grommet';
import { useQuery } from 'urql';
import { useNavigate } from 'react-router-dom';
import { viewMinimumFolderQuery } from '../urql/queries/viewMinimumFolderQuery';

export const FolderLink = ({ folderId }: { folderId?: string }) => {
  const navigate = useNavigate();
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
