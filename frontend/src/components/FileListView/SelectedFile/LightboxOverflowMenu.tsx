import { Menu } from '@mantine/core';
import { useLightboxState } from 'yet-another-react-lightbox';
import type { PicrFile } from '@shared/types/picr';
import {
  DotsIcon,
  InfoIcon,
  SlideshowIcon,
  ThumbnailsIcon,
} from '../../../PicrIcons';
import { useOpenFileInfoModal } from '../../../atoms/modalAtom';
import type { LightboxThumbnails } from './useLightboxThumbnails';

export interface SlideshowControl {
  playing: boolean;
  toggle: () => void;
}

// Collapses the secondary toolbar actions (info, thumbnails, slideshow) into a
// single kebab menu on narrow screens, freeing horizontal space so the filename
// isn't crushed by a full row of icons.
export const LightboxOverflowMenu = ({
  files,
  thumbnails,
  slideshow,
}: {
  files: PicrFile[];
  thumbnails: LightboxThumbnails;
  slideshow: SlideshowControl;
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
        <Menu.Item leftSection={<SlideshowIcon />} onClick={slideshow.toggle}>
          {slideshow.playing ? 'Stop slideshow' : 'Start slideshow'}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
