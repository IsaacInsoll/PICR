import type { PicrFolder } from '@shared/types/picr';
import type { ButtonProps } from '@mantine/core';
import { Button } from '@mantine/core';
import { useSetFolder } from '../hooks/useSetFolder';
import { FolderIcon } from '../PicrIcons';

export const ViewFolderButton = ({
  folder,
  ...props
}: { folder: PicrFolder } & ButtonProps) => {
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
