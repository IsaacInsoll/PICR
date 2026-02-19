import { useOpenFileInfoModal } from '../../../atoms/modalAtom';
import { InfoIcon } from '../../../PicrIcons';
import { PicrFile } from '../../../../types';

export const LightboxInfoButton = ({ file }: { file: PicrFile }) => {
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
