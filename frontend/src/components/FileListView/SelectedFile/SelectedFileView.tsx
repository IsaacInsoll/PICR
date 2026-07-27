// The "Lightbox" appears when an individual image is selected
import type {
  CarouselSettings,
  ControllerRef,
  ImageProps,
  Slide,
  SlideshowRef,
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router';
import { LightboxFileRating } from './LightboxFileRating';
import { filesForLightbox, isPicrVideoSlide } from './filesForLightbox';
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
import {
  canUseShareSheet,
  shareOrDownload,
} from '../../../helpers/shareOrDownload';
import { LazyPicrVideoPlayer } from '../../LazyPicrVideoPlayer';
import { wasOpenedFromFolderInCurrentDocument } from '../../../hooks/useSelectedFileId';
import { useLightboxChromeAutoHide } from '../../../hooks/useLightboxChromeAutoHide';
import { useLightboxThumbnails } from './useLightboxThumbnails';
import { useLightboxToolbar } from './useLightboxToolbar';
import { useLightboxShortcuts } from './useLightboxShortcuts';
import type { SlideshowControl } from './LightboxOverflowMenu';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { useCommentPermissions } from '../../../hooks/useCommentPermissions';

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
  const thumbnails = useLightboxThumbnails();

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
  const chromeVisible = useLightboxChromeAutoHide(!!selectedFileId);
  const isMobile = !!useIsMobile();
  const { isNone } = useCommentPermissions();

  useLightboxShortcuts({
    active: !!selectedFileId,
    file: selectedImage,
    controllerRef: ref,
  });

  // Slideshow lives in the mobile overflow menu, so we drive it through a ref and
  // track its playing state via YARL's slideshow callbacks to label the menu item.
  const slideshowRef = useRef<SlideshowRef | null>(null);
  const [slideshowPlaying, setSlideshowPlaying] = useState(false);
  const toggleSlideshow = useCallback(() => {
    const s = slideshowRef.current;
    if (!s) return;
    if (s.playing) s.pause();
    else s.play();
  }, []);
  const slideshow = useMemo<SlideshowControl>(
    () => ({ playing: slideshowPlaying, toggle: toggleSlideshow }),
    [slideshowPlaying, toggleSlideshow],
  );

  const noDownloadMediaProps = useNoDownloadMediaProps();
  const imageProps: ImageProps = {
    ...carouselImageProps,
    ...noDownloadMediaProps,
    style: {
      ...carouselImageProps.style,
      ...noDownloadMediaProps.style,
    },
  };

  const { buttons, plugins } = useLightboxToolbar({
    files,
    canDownload,
    isSelectedVideo,
    isMobile,
    footerShowsCounter: !isNone && files.length > 1,
    thumbnails,
    slideshow,
  });

  const rootClassName =
    [
      chromeVisible ? undefined : 'picr-lightbox-idle',
      thumbnails.mounted && !thumbnails.expanded
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
      plugins={plugins}
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
      toolbar={{ buttons }}
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
      thumbnails={thumbnails.mounted ? { position: 'bottom' } : undefined}
      slideshow={{ ref: slideshowRef }}
      zoom={{
        pinchZoomV4: true,
        maxZoomPixelRatio: 5,
      }}
      on={{
        entered: unInert,
        slideshowStart: () => setSlideshowPlaying(true),
        slideshowStop: () => setSlideshowPlaying(false),
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

// The photo is shown "contained" (whole image visible, never cropped) while
// still filling the viewport. This deliberately uses BOTH settings, which is why
// they look contradictory at a glance: `imageFit: 'cover'` (on carouselProps
// below) sizes the <img> element to fill the entire slide — dropping YARL's
// default carousel padding that otherwise wastes space, most noticeably on
// mobile — and `objectFit: 'contain'` here then letterboxes the actual photo
// inside that full-size element so nothing is cropped. The full-size element
// also lets the no-download overlay cover the whole slide. Don't collapse this
// to a single setting without re-checking mobile padding first.
const carouselImageProps: ImageProps = {
  style: { objectFit: 'contain' },
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
  imageFit: 'cover' as const, // see carouselImageProps: pairs with objectFit:'contain'
  padding: 0,
  spacing: 0,
  imageProps: carouselImageProps,
};
