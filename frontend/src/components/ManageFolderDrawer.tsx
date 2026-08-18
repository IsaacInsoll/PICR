import { PicrDrawer } from './PicrDrawer';
import { ManageFolder } from '../pages/ManageFolder';
import type { PicrFolder } from '@shared/types/picr';
import { normalizeDisplayName } from '@shared/displayName';
import { Center } from '@mantine/core';
import { LoadingIndicator } from './LoadingIndicator';
import { useTranslation } from 'react-i18next';

export const ManageFolderDrawer = ({
  folder,
  onClose,
}: {
  folder: PicrFolder;
  onClose: () => void;
}) => {
  const { t } = useTranslation('admin');
  return (
    <PicrDrawer
      title={t('folder.manageTitle', {
        folder: normalizeDisplayName(folder.name),
      })}
      onClose={onClose}
    >
      <ManageFolder folder={folder} />
    </PicrDrawer>
  );
};

export const ManageFolderDrawerLoading = ({
  folderName,
  onClose,
}: {
  folderName: string;
  onClose: () => void;
}) => {
  const { t } = useTranslation('admin');
  return (
    <PicrDrawer
      title={t('folder.manageTitle', {
        folder: normalizeDisplayName(folderName),
      })}
      onClose={onClose}
    >
      <Center py="xl">
        <LoadingIndicator />
      </Center>
    </PicrDrawer>
  );
};
