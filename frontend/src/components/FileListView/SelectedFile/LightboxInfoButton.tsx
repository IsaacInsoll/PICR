import { useOpenFileInfoModal } from '../../../atoms/modalAtom';
import { InfoIcon } from '../../../PicrIcons';
import type { PicrFile } from '@shared/types/picr';
import { useLightboxState } from 'yet-another-react-lightbox';
import { LightboxIconButton } from './LightboxIconButton';

export const LightboxInfoButton = ({ files }: { files: PicrFile[] }) => {
  const openFileInfo = useOpenFileInfoModal();
  const { currentIndex } = useLightboxState();
  const file = files.at(currentIndex);

  if (!file) return null;

  return (
    <LightboxIconButton
      icon={<InfoIcon size="16" />}
      label="File info"
      onClick={() => openFileInfo(file.id)}
    />
  );
};
