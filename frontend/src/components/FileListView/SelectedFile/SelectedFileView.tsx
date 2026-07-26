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
import { useLightboxChromeAutoHide } from '../../../hooks/useLightboxChromeAutoHide';

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
  // The filmstrip mounts lazily on first reveal (so galleries that never open it
  // don't load thumbnails), then stays mounted so it can slide open/closed via a
  // CSS height transition instead of popping in/out. `expanded` drives that
  // transition; opening flips it a frame after mount (below) so the very first
  // open animates too, while closing collapses it straight from the handler.
  const [thumbnailsMounted, setThumbnailsMounted] = useState(false);
  const [thumbnailsExpanded, setThumbnailsExpanded] = useState(false);

  const setControllerRef = useSetAtom(lightboxControllerRefAtom);

  useEffect(() => {
    setControllerRef(ref);
  }, [setControllerRef, ref]);

  useEffect(() => {
    if (!thumbnailsMounted || !showThumbnails) return;
    // Wait one frame after mount so the collapsed→expanded height transition runs.
    const raf = requestAnimationFrame(() => setThumbnailsExpanded(true));
    return () => cancelAnimationFrame(raf);
  }, [showThumbnails, thumbnailsMounted]);

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
  const chromeVisible = useLightboxChromeAutoHide(!!selectedFileId);
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
        onClick={() => {
          if (showThumbnails) {
            // Element is already mounted+painted, so collapsing straight away
            // still animates via the CSS height transition.
            setShowThumbnails(false);
            setThumbnailsExpanded(false);
          } else {
            setThumbnailsMounted(true);
            setShowThumbnails(true);
          }
        }}
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
        (plugin) => thumbnailsMounted || plugin !== Thumbnails,
      ),
    };
  }, [canDownload, thumbnailsMounted, toolbarButtons]);

  const rootClassName =
    [
      chromeVisible ? undefined : 'picr-lightbox-idle',
      thumbnailsMounted && !thumbnailsExpanded
        ? 'picr-thumbnails-collapsed'
        : undefined,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <Lightbox
      className={rootClassName}
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
        // Scrims keep the floating chrome legible over any image without
        // reserving bars/letterboxing the photo (issue #47). They render inside
        // the slide (above the image, below the title/rating), so the
        // container-level toolbar/nav/counter naturally sit on top of them.
        slideHeader: () => (
          <div className="picr-lightbox-scrim picr-lightbox-scrim-top" />
        ),
        slideFooter: () => (
          <>
            <div className="picr-lightbox-scrim picr-lightbox-scrim-bottom" />
            <LightboxFileRating files={files} />
          </>
        ),
      }}
      carousel={{
        ...carouselProps,
        imageProps,
      }}
      thumbnails={thumbnailsMounted ? { position: 'bottom' } : undefined}
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

// Counter sits bottom-right so it doesn't collide with the rating footer
// (bottom-left). See the mockup in issue #47.
const counterProps = {
  container: { style: { top: 'unset', bottom: 0, left: 'unset', right: 0 } },
};

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
