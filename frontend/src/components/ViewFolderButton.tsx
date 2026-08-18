import type { PicrFolder } from '@shared/types/picr';
import type { ButtonProps } from '@mantine/core';
import { Button, Tooltip } from '@mantine/core';
import { useFolderLink } from '../hooks/useSetFolder';
import { FolderIcon } from '../PicrIcons';
import { useTranslation } from 'react-i18next';

export const ViewFolderButton = ({
  folder,
  iconOnly = false,
  ...props
}: { folder: PicrFolder; iconOnly?: boolean } & ButtonProps) => {
  const { t } = useTranslation('gallery');
  const folderLink = useFolderLink(folder);
  const button = (
    <Button
      {...props}
      {...folderLink}
      aria-label={iconOnly ? t('folder.view') : undefined}
      onClick={(event) => event.stopPropagation()}
    >
      <FolderIcon />
      {iconOnly ? null : t('folder.view')}
    </Button>
  );

  return iconOnly ? (
    <Tooltip label={t('folder.view')}>
      <span>{button}</span>
    </Tooltip>
  ) : (
    button
  );
};
