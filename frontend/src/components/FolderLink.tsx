import { Anchor } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useBaseViewFolderURL } from '../pages/ViewFolder';
import { MinimalFolder } from '../../types';

export const FolderLink = ({ folder }: { folder: MinimalFolder }) => {
  const baseUrl = useBaseViewFolderURL();
  const navigate = useNavigate();
  if (!folder) return undefined;
  return (
    <Anchor onClick={() => navigate(baseUrl + folder?.id)}>
      {folder?.name}
    </Anchor>
  );
};
