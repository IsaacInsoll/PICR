import { MinimalFolder } from '../../types';
import { NavLink } from 'react-router';
import { useBaseViewFolderURL } from '../hooks/useBaseViewFolderURL';
import { FolderIcon, ManageFolderIcon } from '../PicrIcons';
import { ActionIcon, Button } from '@mantine/core';
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
  const icon = managing ? <FolderIcon /> : <ManageFolderIcon />;
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

export const ManageFolderIconButton = ({
  folder,
}: {
  folder: MinimalFolder;
}) => {
  const baseUrl = useBaseViewFolderURL();
  const setPlaceholderFolder = useSetAtom(placeholderFolder);
  const onClick = () => {
    setPlaceholderFolder({ ...folder });
  };
  return (
    <ActionIcon
      component={NavLink}
      to={baseUrl + folder.id + '/manage/links'}
      onClick={onClick}
      variant="outline"
      // size="xs"
    >
      <ManageFolderIcon />
    </ActionIcon>
  );
};
