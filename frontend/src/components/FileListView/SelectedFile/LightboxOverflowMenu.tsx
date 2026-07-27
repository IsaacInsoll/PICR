import { Menu } from '@mantine/core';
import { useLightboxState } from 'yet-another-react-lightbox';
import type { PicrFile } from '@shared/types/picr';
import { DotsIcon, InfoIcon, ThumbnailsIcon } from '../../../PicrIcons';
import { useOpenFileInfoModal } from '../../../atoms/modalAtom';
import type { LightboxThumbnails } from './useLightboxThumbnails';

// Collapses the secondary toolbar actions (info, thumbnails) into a
// single kebab menu on narrow screens, freeing horizontal space so the filename
// isn't crushed by a full row of icons.
export const LightboxOverflowMenu = ({
  files,
  thumbnails,
}: {
  files: PicrFile[];
  thumbnails: LightboxThumbnails;
}) => {
  const { currentIndex } = useLightboxState();
  const openFileInfo = useOpenFileInfoModal();
  const file = files.at(currentIndex);

  return (
    <Menu shadow="md" width={200} position="bottom-end">
      <Menu.Target>
        <button
          type="button"
          className="yarl__button"
          aria-label="More options"
          title="More options"
        >
          <DotsIcon size="24" />
        </button>
      </Menu.Target>
      <Menu.Dropdown>
        {file ? (
          <Menu.Item
            leftSection={<InfoIcon />}
            onClick={() => openFileInfo(file.id)}
          >
            File info
          </Menu.Item>
        ) : null}
        <Menu.Item leftSection={<ThumbnailsIcon />} onClick={thumbnails.toggle}>
          {thumbnails.visible ? 'Hide thumbnails' : 'Show thumbnails'}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
