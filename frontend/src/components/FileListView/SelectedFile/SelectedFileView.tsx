// The "Lightbox" appears when an individual image is selected
import type {
  CarouselSettings,
  ControllerRef,
  ImageProps,
  Slide,
  SlotStyles,
} from 'yet-another-react-lightbox';
import { isImageSlide, Lightbox } from 'yet-another-react-lightbox';

import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import './SelectedFileView.css';
import type { ViewFolderFileWithHero } from '@shared/files/sortFiles';
import { theme } from '../../../theme';
import { useSetFolder } from '../../../hooks/useSetFolder';
import { useEffect, useRef, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router';
import { LightboxFileRating } from './LightboxFileRating';
import { filesForLightbox, isPicrVideoSlide } from './filesForLightbox';
import { LightboxInfoButton } from './LightboxInfoButton';
import { lightboxPlugins, lightboxPluginsProof } from './lightboxPlugins';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { lightboxControllerRefAtom } from '../../../atoms/lightboxControllerRefAtom';
import { lightboxRefAtom } from '../../../atoms/lightboxRefAtom';
import { videoAutoplayBlessedAtom } from '../../../atoms/videoAutoplayBlessedAtom';
import {
  useCanDownload,
  useOriginalsForLightbox,
  useServerThumbnailDimensions,
} from '../../../hooks/useMe';
import { useNoDownloadMediaProps } from '../../../hooks/useNoDownloadMediaProps';
import { Thumbnails } from 'yet-another-react-lightbox/plugins';
import { ThumbnailsIcon } from '../../../PicrIcons';
import {
  canUseShareSheet,
  shareOrDownload,
} from '../../../helpers/shareOrDownload';
import { LazyPicrVideoPlayer } from '../../LazyPicrVideoPlayer';
import { wasOpenedFromFolderInCurrentDocument } from '../../../hooks/useSelectedFileId';

export const SelectedFileView = ({
  files,
  selectedFileId,
  setSelectedFileId,
  folderId,
}: {
  files: ViewFolderFileWithHero[];
  selectedFileId?: string;
  setSelectedFileId: (id: string | undefined) => void;
  folderId: string;
}) => {
  const selectedImageIndex = files.findIndex(({ id }) => id === selectedFileId);
  const selectedImage = files.find(({ id }) => id === selectedFileId);
  const ref = useRef<ControllerRef | null>(null);
  const { fileId } = useParams();
  const location = useLocation();
  const portal = useAtomValue(lightboxRefAtom);
  const [showThumbnails, setShowThumbnails] = useState(false);

  const setControllerRef = useSetAtom(lightboxControllerRefAtom);

  useEffect(() => {
    setControllerRef(ref);
  }, [setControllerRef, ref]);

  const setFolder = useSetFolder();
  const canDownload = useCanDownload();
  const useOriginals = useOriginalsForLightbox();
  const thumbnailDimensions = useServerThumbnailDimensions();
  const [autoplayBlessed, setAutoplayBlessed] = useAtom(
    videoAutoplayBlessedAtom,
  );
  // Autoplay the active slide when the lightbox was opened by a folder click (a
  // fresh user gesture) or once any video has been played this session (see
  // videoAutoplayBlessedAtom). A deep-linked/reloaded session stays silent until
  // the user plays one video themselves.
  const autoPlayVideo =
    wasOpenedFromFolderInCurrentDocument(location.state) || autoplayBlessed;
  const isSelectedVideo = selectedImage?.type === 'Video';
  const noDownloadMediaProps = useNoDownloadMediaProps();
  const imageProps: ImageProps = {
    ...carouselImageProps,
    ...noDownloadMediaProps,
    style: {
      ...carouselImageProps.style,
      ...noDownloadMediaProps.style,
    },
  };

  const toolbarButtons = useMemo(
    () => [
      <LightboxInfoButton files={files} key="InfoButton" />,
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
      ...(isSelectedVideo ? [] : ['slideshow']),
      'close',
    ],
    [files, isSelectedVideo, showThumbnails],
  );

  const config = useMemo(() => {
    return {
      buttons: canDownload ? ['download', ...toolbarButtons] : toolbarButtons,
      plugins: (canDownload ? lightboxPlugins : lightboxPluginsProof).filter(
        (plugin) => showThumbnails || plugin !== Thumbnails,
      ),
    };
  }, [canDownload, showThumbnails, toolbarButtons]);

  return (
    <Lightbox
      portal={{ root: portal?.current }}
      controller={{ ref }}
      plugins={config.plugins}
      counter={counterProps}
      slides={filesForLightbox(
        files,
        canDownload,
        useOriginals,
        thumbnailDimensions,
      )}
      open={!!selectedFileId}
      index={selectedImageIndex}
      close={() => setSelectedFileId(undefined)}
      styles={lightBoxStyles}
      download={{ download: lightboxDownload }}
      toolbar={{ buttons: config.buttons }}
      render={{
        slide: ({ slide, offset, rect }) => {
          if (!isPicrVideoSlide(slide)) return undefined;

          const active = offset === 0;
          return (
            <LazyPicrVideoPlayer
              active={active}
              autoPlay={autoPlayVideo}
              canDownload={canDownload}
              duration={slide.duration}
              onPlay={() => setAutoplayBlessed(true)}
              poster={slide.poster}
              src={slide.src}
              style={{
                width: rect.width,
                height: rect.height,
              }}
              title={typeof slide.title === 'string' ? slide.title : ''}
            />
          );
        },
        slideFooter: () => <LightboxFileRating files={files} />,
      }}
      carousel={{
        ...carouselProps,
        imageProps,
      }}
      thumbnails={showThumbnails ? { position: 'bottom' } : undefined}
      zoom={{
        pinchZoomV4: true,
        maxZoomPixelRatio: 5,
      }}
      on={{
        entered: unInert,
        view: ({ index }) => {
          const f = files[index];
          // don't change URL if we are already on that URL (IE: first opening gallery)
          if (f.id !== fileId) {
            // carry the current entry's state across: it marks whether this lightbox
            // was opened from the folder, which is what lets close() pop instead of
            // push (see useSelectedFileId). Replacing without it would strand the
            // entry and make the back button appear to do nothing.
            setFolder({ id: folderId }, f, {
              replace: true,
              state: location.state,
            });
          }
        },
      }}
    />
  );
};

const lightBoxStyles: SlotStyles = {
  root: { fontFamily: theme.fontFamily, zIndex: 200 }, // mantine modals are 200
};

// On iOS, route media downloads through the native share sheet ("Save to Photos")
// instead of the anchor `download` attribute (which opens "Save to Files").
const lightboxDownload = ({
  slide,
  saveAs,
}: {
  slide: Slide;
  saveAs: (source: string | Blob, name?: string) => void;
}) => {
  const { download } = slide;
  const url =
    typeof download === 'object'
      ? download.url
      : typeof download === 'string'
        ? download
        : slide.downloadUrl;
  const filename =
    typeof download === 'object' ? download.filename : slide.downloadFilename;
  if (!url) return;
  // Only route media (Image/Video) through the iOS share sheet; documents keep the
  // regular anchor download ("Save to Files"), matching isShareableMediaFile elsewhere.
  // A non-media File slide is an empty object (see filesForLightbox), so it has neither
  // an image src nor video `sources`.
  const isMedia = isImageSlide(slide) || isPicrVideoSlide(slide);
  if (isMedia && canUseShareSheet()) {
    void shareOrDownload(url, filename ?? '');
  } else {
    saveAs(url, filename);
  }
};

const counterProps = { container: { style: { top: 'unset', bottom: 0 } } };

const carouselImageProps: ImageProps = {
  style: { objectFit: 'contain' }, // fix image getting cropped
};

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
  finite: false,
  preload: 2,
  imageFit: 'cover' as const, // we want 'cover' otherwise there is too much padding on mobile
  padding: 0,
  spacing: 0,
  imageProps: carouselImageProps,
};
