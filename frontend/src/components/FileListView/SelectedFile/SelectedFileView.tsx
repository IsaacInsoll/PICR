// The "Lightbox" appears when an individual image is selected
import {
  CarouselSettings,
  ControllerRef,
  Lightbox,
  SlotStyles,
} from 'yet-another-react-lightbox';

import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import './SelectedFileView.css';
import { FileListViewStyleComponentProps } from '../FolderContentsView';
import { theme } from '../../../theme';
import { useSetFolder } from '../../../hooks/useSetFolder';
import { useEffect, useRef, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { LightboxFileRating } from './LightboxFileRating';
import { filesForLightbox } from './filesForLightbox';
import { LightboxInfoButton } from './LightboxInfoButton';
import { lightboxPlugins, lightboxPluginsProof } from './lightboxPlugins';
import { useAtomValue, useSetAtom } from 'jotai';
import { lightboxControllerRefAtom } from '../../../atoms/lightboxControllerRefAtom';
import { lightboxRefAtom } from '../../../atoms/lightboxRefAtom';
import { useCanDownload } from '../../../hooks/useMe';
import { Thumbnails } from 'yet-another-react-lightbox/plugins';
import { DashboardIcon, ThumbnailsIcon } from '../../../PicrIcons';

export const SelectedFileView = ({
  files,
  selectedFileId,
  setSelectedFileId,
  folderId,
}: FileListViewStyleComponentProps) => {
  const selectedImageIndex = files.findIndex(({ id }) => id === selectedFileId);
  const selectedImage = files.find(({ id }) => id === selectedFileId);
  const ref = useRef<ControllerRef>(null);
  const { fileId } = useParams();
  const portal = useAtomValue(lightboxRefAtom);
  const [showThumbnails, setShowThumbnails] = useState(false);

  const setControllerRef = useSetAtom(lightboxControllerRefAtom);

  useEffect(() => {
    setControllerRef(ref);
  }, [setControllerRef, ref]);

  const setFolder = useSetFolder();
  const canDownload = useCanDownload();

  const toolbarButtons = [
    <LightboxInfoButton file={selectedImage} key="InfoButton" />,
    <button
      key="thumbnails-toggle"
      type="button"
      className="yarl__button"
      onClick={() => setShowThumbnails((prev) => !prev)}
      aria-pressed={showThumbnails}
      title={showThumbnails ? 'Hide thumbnails' : 'Show thumbnails'}
    >
      <ThumbnailsIcon size="24" />
    </button>,
    'slideshow',
    'close',
  ];

  const config = useMemo(() => {
    return {
      buttons: canDownload ? ['download', ...toolbarButtons] : toolbarButtons,
      plugins: (canDownload ? lightboxPlugins : lightboxPluginsProof).filter(
        (plugin) => showThumbnails || plugin !== Thumbnails,
      ),
    };
  }, [canDownload, showThumbnails]);

  return (
    <Lightbox
      portal={{ root: portal?.current }}
      controller={{ ref }}
      plugins={config.plugins}
      counter={counterProps}
      slides={filesForLightbox(files)}
      open={!!selectedFileId}
      index={selectedImageIndex}
      close={() => setSelectedFileId(undefined)}
      styles={lightBoxStyles}
      video={videoProps}
      toolbar={{ buttons: config.buttons }}
      render={{
        slideFooter: ({ slide }) => (
          <LightboxFileRating slide={slide} selected={selectedImage} />
        ),
      }}
      carousel={carouselProps}
      thumbnails={showThumbnails ? { position: 'bottom' } : undefined}
      on={{
        entered: unInert,
        view: ({ index }) => {
          const f = files[index];
          // don't change URL if we are already on that URL (IE: first opening gallery)
          if (f?.id && f.id != fileId) {
            setFolder({ id: folderId }, f, { replace: true });
          }
        },
      }}
    />
  );
};

const lightBoxStyles: SlotStyles = {
  root: { fontFamily: theme.fontFamily, zIndex: 200 }, // mantine modals are 200
};

const counterProps = { container: { style: { top: 'unset', bottom: 0 } } };
const videoProps = { autoPlay: true, muted: false };

const unInert = () => {
  // YARL "inerts" everything so lets undo that if we have modals
  // https://github.com/igordanchenko/yet-another-react-lightbox/issues/310#issuecomment-2407706206
  document
    .querySelectorAll('body > div[data-portal="true"]')
    .forEach((node) => {
      node.removeAttribute('inert');
      node.removeAttribute('aria-hidden');
    });
};

const carouselProps: CarouselSettings = {
  imageFit: 'cover' as const, // we want 'cover' otherwise there is too much padding on mobile
  padding: 0,
  spacing: 0,
  imageProps: {
    style: { objectFit: 'contain' }, // fix image getting cropped
  },
};
