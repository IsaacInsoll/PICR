import { MinimalFolder } from '../../types';
import { Button, ButtonProps, Paper } from '@mantine/core';
import { FolderIcon } from '../PicrIcons';
import { useSetFolder } from '../hooks/useSetFolder';

// "Thumbnail Preview" of a folder so you can see it inline with images
export const PicrFolder = ({
  folder,
  ...props
}: {
  folder: MinimalFolder;
} & ButtonProps) => {
  return (
    <Button {...props} leftSection={<FolderIcon />} fullWidth variant="default">
      {folder.name}
    </Button>
  );
};
