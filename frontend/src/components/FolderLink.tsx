import { Anchor } from 'grommet';
import { useQuery } from 'urql';
import { useHref, useNavigate, useNavigation } from 'react-router-dom';
import { viewMinimumFolderQuery } from '../urql/queries/viewMinimumFolderQuery';
import { useBaseViewFolderURL } from '../pages/ViewFolder';

export const FolderLink = ({ folderId }: { folderId?: string }) => {
  const baseUrl = useBaseViewFolderURL();
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
      onClick={() => navigate(baseUrl + folder?.id)}
    />
  );
};
