import type { PicrFolder } from '@shared/types/picr';
import type { ButtonProps } from '@mantine/core';
import { Button } from '@mantine/core';
import { useFolderLink } from '../hooks/useSetFolder';
import { FolderIcon } from '../PicrIcons';

export const ViewFolderButton = ({
  folder,
  ...props
}: { folder: PicrFolder } & ButtonProps) => {
  return (
    <Button {...props} {...useFolderLink(folder)}>
      <FolderIcon />
      View Folder
    </Button>
  );
};
