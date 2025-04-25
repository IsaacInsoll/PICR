import { MinimalFolder } from '../../types';
import { NavLink, useNavigate } from 'react-router';
import { useBaseViewFolderURL } from '../hooks/useBaseViewFolderURL';
import { useCallback } from 'react';
import { FolderIcon } from '../PicrIcons';
import { TbFolderStar } from 'react-icons/tb';
import { Button } from '@mantine/core';
import { useSetAtom } from 'jotai';
import { placeholderFolder } from './FolderHeader/PlaceholderFolder';

export const ManageFolderButton = ({
  folder,
  managing,
}: {
  folder: MinimalFolder;
  managing: boolean;
}) => {
  const baseUrl = useBaseViewFolderURL();
  const setPlaceholderFolder = useSetAtom(placeholderFolder);
  const icon = managing ? <FolderIcon /> : <TbFolderStar />;
  const onClick = () => {
    setPlaceholderFolder({ ...folder });
  };
  return (
    <Button
      component={NavLink}
      to={baseUrl + folder.id + (managing ? '' : '/manage/links')}
      onClick={onClick}
      variant="outline"
      leftSection={icon}
      size="xs"
    >
      {managing ? 'View' : 'Manage'} folder
    </Button>
  );
};
