import { displayFolderName } from '@shared/displayName';
import type { FolderDisplayIdentity } from '@shared/displayName';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export const useFolderNameFormatter = () => {
  const { t } = useTranslation('common');
  const rootLabel = t('folder.home');

  return useCallback(
    (folder: FolderDisplayIdentity | null | undefined) =>
      displayFolderName(folder, rootLabel),
    [rootLabel],
  );
};
