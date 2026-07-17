import type { PicrFolder } from '@shared/types/picr';
import { NavLink } from 'react-router';
import { useBaseViewFolderURL } from '../hooks/useBaseViewFolderURL';
import { FolderIcon, ManageFolderIcon } from '../PicrIcons';
import { ActionIcon, Button } from '@mantine/core';

export const ManageFolderButton = ({
  folder,
  managing,
}: {
  folder: PicrFolder;
  managing: boolean;
}) => {
  const baseUrl = useBaseViewFolderURL();
  const icon = managing ? <FolderIcon /> : <ManageFolderIcon />;
  return (
    <Button
      component={NavLink}
      to={baseUrl + folder.id + (managing ? '' : '/manage/links')}
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
  variant = 'outline',
  color,
}: {
  folder: PicrFolder;
  variant?: string;
  color?: string;
}) => {
  const baseUrl = useBaseViewFolderURL();
  return (
    <ActionIcon
      component={NavLink}
      to={baseUrl + folder.id + '/manage/links'}
      variant={variant}
      color={color}
      // size="xs"
    >
      <ManageFolderIcon />
    </ActionIcon>
  );
};
