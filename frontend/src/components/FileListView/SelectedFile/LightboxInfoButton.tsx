import { useOpenFileInfoModal } from '../../../atoms/modalAtom';
import { InfoIcon } from '../../../PicrIcons';
import type { PicrFile } from '@shared/types/picr';
import { useLightboxState } from 'yet-another-react-lightbox';

export const LightboxInfoButton = ({ files }: { files: PicrFile[] }) => {
  const openFileInfo = useOpenFileInfoModal();
  const { currentIndex } = useLightboxState();
  const file = files.at(currentIndex);

  if (!file) return null;

  return (
    <button
      key="my-button"
      type="button"
      className="yarl__button"
      title="View file info"
      onClick={() => openFileInfo(file.id)}
    >
      <InfoIcon size="24" />
    </button>
  );
};
