import type { PicrFolder } from '@shared/types/picr';
import type { ButtonProps } from '@mantine/core';
import { Button, Tooltip } from '@mantine/core';
import { useFolderLink } from '../hooks/useSetFolder';
import { FolderIcon } from '../PicrIcons';

export const ViewFolderButton = ({
  folder,
  iconOnly = false,
  ...props
}: { folder: PicrFolder; iconOnly?: boolean } & ButtonProps) => {
  const folderLink = useFolderLink(folder);
  const button = (
    <Button
      {...props}
      {...folderLink}
      aria-label={iconOnly ? 'View folder' : undefined}
      onClick={(event) => event.stopPropagation()}
    >
      <FolderIcon />
      {iconOnly ? null : 'View Folder'}
    </Button>
  );

  return iconOnly ? (
    <Tooltip label="View folder">
      <span>{button}</span>
    </Tooltip>
  ) : (
    button
  );
};
