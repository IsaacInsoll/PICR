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
import { FileListViewStyleComponentProps } from '../FolderContentsView';
import { theme } from '../../../theme';
import { useSetFolder } from '../../../hooks/useSetFolder';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useParams } from 'react-router';
import { LightboxFileRating } from './LightboxFileRating';
import { filesForLightbox } from './filesForLightbox';
import { LightboxInfoButton } from './LightboxInfoButton';
import { lightboxPlugins } from './lightboxPlugins';
import { useAtomValue, useSetAtom } from 'jotai';
import { lightboxControllerRefAtom } from '../../../atoms/lightboxControllerRefAtom';
import { lightboxRefAtom } from '../../../atoms/lightboxRefAtom';
import { viewTransitionNameForFile } from '../../../helpers/viewTransitions';

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
  const lastTransitionImage = useRef<HTMLImageElement | null>(null);

  const setControllerRef = useSetAtom(lightboxControllerRefAtom);

  useEffect(() => {
    setControllerRef(ref);
  }, [setControllerRef, ref]);

  const setFolder = useSetFolder();

  const toolbarButtons = [
    'download',
    <LightboxInfoButton file={selectedImage} key="InfoButton" />,
    'slideshow',
    'close',
  ];

  useLayoutEffect(() => {
    if (!selectedImage?.id) return;
    const root = portal?.current ?? document;
    const transitionName = viewTransitionNameForFile(selectedImage.id);

    const apply = () => {
      const image = root.querySelector('.yarl__slide_current img');
      if (!(image instanceof HTMLImageElement)) return;
      if (lastTransitionImage.current && lastTransitionImage.current !== image) {
        lastTransitionImage.current.style.viewTransitionName = '';
      }
      image.style.viewTransitionName = transitionName;
      lastTransitionImage.current = image;
    };

    const raf = requestAnimationFrame(apply);
    const observer = new MutationObserver(() => apply());
    observer.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
    });

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      if (lastTransitionImage.current) {
        lastTransitionImage.current.style.viewTransitionName = '';
        lastTransitionImage.current = null;
      }
    };
  }, [selectedImage?.id, portal]);

  return (
    <Lightbox
      portal={{ root: portal?.current }}
      controller={{ ref }}
      plugins={lightboxPlugins}
      counter={counterProps}
      slides={filesForLightbox(files)}
      open={!!selectedFileId}
      index={selectedImageIndex}
      close={() => setSelectedFileId(undefined)}
      styles={lightBoxStyles}
      video={videoProps}
      toolbar={{ buttons: toolbarButtons }}
      render={{
        slideFooter: ({ slide }) => (
          <LightboxFileRating slide={slide} selected={selectedImage} />
        ),
      }}
      carousel={carouselProps}
      thumbnails={{ position: 'bottom' }}
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
