import { Anchor } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useBaseViewFolderURL } from '../pages/ViewFolder';
import { MinimalFolder } from '../../types';
import { useSetAtom } from 'jotai/index';
import { placeholderFolder } from './FolderHeader/PlaceholderFolder';

export const FolderLink = ({ folder }: { folder: MinimalFolder }) => {
  const baseUrl = useBaseViewFolderURL();
  const navigate = useNavigate();
  const setPlaceholderFolder = useSetAtom(placeholderFolder);
  if (!folder) return undefined;
  const handleClick = () => {
    setPlaceholderFolder(folder);
    navigate(baseUrl + folder?.id);
  };
  return <Anchor onClick={handleClick}>{folder?.name}</Anchor>;
};
