import { Anchor } from 'grommet';
import { useNavigate } from 'react-router-dom';
import { useBaseViewFolderURL } from '../pages/ViewFolder';
import { MinimalFolder } from '../../types';

export const FolderLink = ({ folder }: { folder: MinimalFolder }) => {
  const baseUrl = useBaseViewFolderURL();
  const navigate = useNavigate();
  if (!folder) return undefined;
  return (
    <Anchor
      label={folder?.name}
      onClick={() => navigate(baseUrl + folder?.id)}
    />
  );
};
