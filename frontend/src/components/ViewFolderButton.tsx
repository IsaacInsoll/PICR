import { MinimalFolder } from '../../types';
import { Button, ButtonProps } from '@mantine/core';
import { useSetFolder } from '../hooks/useSetFolder';
import { FolderIcon } from '../PicrIcons';

export const ViewFolderButton = ({
  folder,
  ...props
}: { folder: MinimalFolder } & ButtonProps) => {
  const setFolder = useSetFolder();
  const onClick = () => {
    setFolder(folder);
  };
  return (
    <Button {...props} onClick={onClick}>
      <FolderIcon />
      View Folder
    </Button>
  );
};
