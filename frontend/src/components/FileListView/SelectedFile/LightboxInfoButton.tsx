import { useOpenFileInfoModal } from '../../../atoms/modalAtom';
import { InfoIcon } from '../../../PicrIcons';
import type { PicrFile } from '@shared/types/picr';
import { useLightboxState } from 'yet-another-react-lightbox';
import { LightboxIconButton } from './LightboxIconButton';
import { useTranslation } from 'react-i18next';

export const LightboxInfoButton = ({ files }: { files: PicrFile[] }) => {
  const { t } = useTranslation('gallery');
  const openFileInfo = useOpenFileInfoModal();
  const { currentIndex } = useLightboxState();
  const file = files.at(currentIndex);

  if (!file) return null;

  return (
    <LightboxIconButton
      icon={<InfoIcon size="16" />}
      label={t('file.info')}
      onClick={() => openFileInfo(file.id)}
    />
  );
};
