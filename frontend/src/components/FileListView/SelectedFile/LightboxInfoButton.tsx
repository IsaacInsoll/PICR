import { useOpenFileInfoModal } from '../../../atoms/modalAtom';
import { InfoIcon } from '../../../PicrIcons';

export const LightboxInfoButton = ({ file }) => {
  const openFileInfo = useOpenFileInfoModal();
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
