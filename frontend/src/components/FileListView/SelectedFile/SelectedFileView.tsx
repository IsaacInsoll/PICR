// The "Lightbox" appears when an individual image is selected
import { ControllerRef, Lightbox } from 'yet-another-react-lightbox';

import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import { FileListViewStyleComponentProps } from '../FolderContentsView';
import { theme } from '../../../theme';
import { useSetFolder } from '../../../hooks/useSetFolder';
import { useEffect, useRef } from 'react';
import { useParams } from 'react-router';
import { LightboxFileRating } from './LightboxFileRating';
import { filesForLightbox } from './filesForLightbox';
import { LightboxInfoButton } from './LightboxInfoButton';
import { lightboxPlugins } from './lightboxPlugins';
import { useAtomValue } from 'jotai';
import { useSetAtom } from 'jotai/index';
import { lightboxControllerRefAtom } from '../../../atoms/lightboxControllerRefAtom';
import { lightboxRefAtom } from '../../../atoms/lightboxRefAtom';

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

const lightBoxStyles = {
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
