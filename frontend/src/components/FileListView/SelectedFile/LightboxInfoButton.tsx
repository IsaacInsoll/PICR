import { TbInfoCircle } from 'react-icons/tb';
import { useOpenFileInfoModal } from '../../../atoms/modalAtom';

export const LightboxInfoButton = ({ file }) => {
  const openFileInfo = useOpenFileInfoModal();
  return (
    <button
      key="my-button"
      type="button"
      className="yarl__button"
      onClick={() => openFileInfo(file)}
    >
      <TbInfoCircle size="28" />
    </button>
  );
};
