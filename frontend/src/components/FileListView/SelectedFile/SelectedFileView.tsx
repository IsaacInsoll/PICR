// The "Lightbox" appears when an individual image is selected
import type {
  CarouselSettings,
  ControllerRef,
  ImageProps,
  SlotStyles,
} from 'yet-another-react-lightbox';
import {
  Lightbox,
  useController,
  useLightboxState,
} from 'yet-another-react-lightbox';

import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import './SelectedFileView.css';
import type { ViewFolderFileWithHero } from '@shared/files/sortFiles';
import { theme } from '../../../theme';
import { useSetFolder } from '../../../hooks/useSetFolder';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { useLocation, useParams } from 'react-router';
import { LightboxFileRating } from './LightboxFileRating';
import { LightboxBlurUp } from './LightboxBlurUp';
import { filesForLightbox, isPicrVideoSlide } from './filesForLightbox';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { lightboxControllerRefAtom } from '../../../atoms/lightboxControllerRefAtom';
import { lightboxRefAtom } from '../../../atoms/lightboxRefAtom';
import { videoAutoplayBlessedAtom } from '../../../atoms/videoAutoplayBlessedAtom';
import {
  useCanDownload,
  useOriginalsForLightbox,
  useThumbnailVariants,
} from '../../../hooks/useMe';
import { useNoDownloadMediaProps } from '../../../hooks/useNoDownloadMediaProps';
import { LazyPicrVideoPlayer } from '../../LazyPicrVideoPlayer';
import { wasOpenedFromFolderInCurrentDocument } from '../../../hooks/useSelectedFileId';
import { RAIL_HEIGHT } from './lightboxRailsPlugin';
import { LightboxIconButton } from './LightboxIconButton';
import {
  CloseIcon,
  ExitFocusIcon,
  FullscreenIcon,
  NextIcon,
  PreviousIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from '../../../PicrIcons';
import { useLightboxFocus } from '../../../hooks/useLightboxFocus';
import { useLightboxThumbnails } from './useLightboxThumbnails';
import { useLightboxToolbar } from './useLightboxToolbar';
import { useLightboxShortcuts } from './useLightboxShortcuts';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { useTranslation } from 'react-i18next';
import { lightboxLabels } from '../../../i18n/galleryThirdPartyTranslations';

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
  const { t } = useTranslation('gallery');
  // findIndex misses when the file was deleted, is filtered out of the current
  // view, or the URL is a stale deep link. Passing -1 to YARL's `index` is
  // meaningless, so treat "not found" as nothing to open rather than landing on
  // an arbitrary slide.
  const foundIndex = files.findIndex(({ id }) => id === selectedFileId);
  const selectedImageIndex = Math.max(foundIndex, 0);
  const isOpen = !!selectedFileId && foundIndex >= 0;
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
  const thumbnailVariants = useThumbnailVariants();
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
  const isMobile = !!useIsMobile();
  const { focus, toggleFocus } = useLightboxFocus();

  useLightboxShortcuts({
    active: isOpen,
    file: selectedImage,
    controllerRef: ref,
  });

  const noDownloadMediaProps = useNoDownloadMediaProps();
  const imageProps: ImageProps = {
    ...carouselImageProps,
    ...noDownloadMediaProps,
    style: {
      ...carouselImageProps.style,
      ...noDownloadMediaProps.style,
    },
  };

  // Rebuilt only when its inputs change: `on.view` pushes a URL update on every
  // navigation, so an inline call here would allocate a new slides array (and
  // hand YARL new slide identities) on each one.
  const slides = useMemo(
    () => filesForLightbox(files, canDownload, useOriginals, thumbnailVariants),
    [files, canDownload, useOriginals, thumbnailVariants],
  );
  const labels = useMemo(() => lightboxLabels(t), [t]);

  // Video is excluded from tap-to-toggle: tapping a video means play/pause
  // everywhere, so overloading it would break the primary interaction. Video
  // slides use the explicit Focus button in the rail instead.
  const handleImageTap = useCallback(() => {
    if (isSelectedVideo) return;
    toggleFocus();
  }, [isSelectedVideo, toggleFocus]);

  const { buttons, plugins } = useLightboxToolbar({
    files,
    canDownload,
    isMobile,
    thumbnails,
    focus,
    onToggleFocus: toggleFocus,
  });

  const railsReservedHeight = focus ? 0 : RAIL_HEIGHT * 2;
  // Navigation and the counter are meaningless in a single-file folder.
  const hasMultipleFiles = files.length > 1;

  // Rail contents. The toolbar is not rendered here — YARL positions it
  // absolutely at top-right, and the top rail reserves exactly that band of
  // height, so the buttons land inside the rail rather than over the photo.
  //
  // Layout mirrors top and bottom: filename top-left under the toolbar's
  // top-right stack; navigation + counter bottom-left, review controls
  // bottom-right so each corner pairs with the one above it.
  const railsTop = (
    <span className="picr-rail-label">
      {typeof selectedImage?.name === 'string' ? selectedImage.name : ''}
    </span>
  );

  const railsBottom = (
    <>
      <span className="picr-rail-nav">
        {!isMobile && hasMultipleFiles ? (
          <LightboxNavButtons total={files.length} controllerRef={ref} />
        ) : null}
        {hasMultipleFiles ? <LightboxCounter total={files.length} /> : null}
      </span>
      <LightboxFileRating files={files} />
    </>
  );

  const rootClassName =
    [
      focus ? 'picr-lightbox-focus' : undefined,
      // Focus collapses the filmstrip as well as the rails — it means "the image
      // gets the viewport". The preference itself is untouched, so leaving Focus
      // restores whatever the viewer had open.
      thumbnails.visible && !focus ? undefined : 'picr-thumbnails-collapsed',
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <Lightbox
      className={rootClassName}
      portal={{ root: portal?.current }}
      controller={{ ref, closeOnPullDown: true }}
      plugins={plugins}
      slides={slides}
      labels={labels}
      open={isOpen}
      index={selectedImageIndex}
      close={() => setSelectedFileId(undefined)}
      styles={lightBoxStyles}
      toolbar={{ buttons }}
      render={{
        slide: ({ slide, offset, rect }) => {
          if (!isPicrVideoSlide(slide)) return undefined;

          const active = offset === 0;
          return (
            <LazyPicrVideoPlayer
              active={active}
              autoPlay={autoPlayVideo}
              duration={slide.duration}
              onPlay={() => setAutoplayBlessed(true)}
              poster={slide.poster}
              src={slide.src}
              // The lightbox toolbar already offers fullscreen.
              hideFullscreenButton
              // Only while hidden: in Controls state the toolbar already has a
              // Focus toggle, so this would be a duplicate.
              controlBarEnd={
                focus ? (
                  <span className="picr-video-focus-exit">
                    <LightboxIconButton
                      icon={<ExitFocusIcon size="16" />}
                      label={t('lightbox.exitFocus')}
                      onClick={toggleFocus}
                    />
                  </span>
                ) : undefined
              }
              style={{
                width: rect.width,
                // YARL derives `rect` from .yarl__container, which still spans
                // the full height — the rails shrink the carousel inside it.
                // Images are laid out by CSS so they are unaffected, but the
                // video player sizes itself from this rect, so subtract the
                // rails ourselves. See lightboxRailsPlugin.
                height: rect.height - railsReservedHeight,
              }}
              title={typeof slide.title === 'string' ? slide.title : ''}
            />
          );
        },
        // Blur-up placeholder sits above the image while it loads, then fades
        // out to reveal it (see LightboxBlurUp). Keeping the default container
        // children preserves YARL's slide layout/zoom.
        slideContainer: ({ slide, children }) => (
          <>
            {children}
            <LightboxBlurUp slide={slide} />
          </>
        ),
        // Plugin buttons routed through LightboxIconButton so all chrome shares
        // one look.
        // YARL substitutes this result directly into Toolbar's mapped buttons
        // array, so the custom replacement must carry the key that its default
        // close button would otherwise provide.
        buttonClose: () => <LightboxCloseButton key="close" />,
        // Icon stays the same when engaged; `active` gives it a filled
        // background so it reads as a toggle that is on, rather than swapping to
        // an "exit" icon that describes the action instead of the state.
        buttonFullscreen: ({ fullscreen, disabled, enter, exit }) =>
          disabled ? null : (
            <LightboxIconButton
              icon={<FullscreenIcon size="16" />}
              label={
                fullscreen
                  ? t('lightbox.exitFullscreen')
                  : t('lightbox.fullscreen')
              }
              active={fullscreen}
              onClick={fullscreen ? exit : enter}
            />
          ),
        // Zoom controls are hidden on mobile, where pinch is the gesture.
        buttonZoom: isMobile
          ? () => null
          : ({ zoom, maxZoom, minZoom, disabled, zoomIn, zoomOut }) => (
              <>
                <LightboxIconButton
                  icon={<ZoomInIcon size="16" />}
                  label={t('lightbox.zoomIn')}
                  disabled={disabled || zoom >= maxZoom}
                  onClick={zoomIn}
                />
                <LightboxIconButton
                  icon={<ZoomOutIcon size="16" />}
                  label={t('lightbox.zoomOut')}
                  disabled={disabled || zoom <= minZoom}
                  onClick={zoomOut}
                />
              </>
            ),
      }}
      carousel={{
        ...carouselProps,
        imageProps,
      }}
      thumbnails={thumbnailsProps}
      zoom={{
        pinchZoomV4: true,
        maxZoomPixelRatio: 5,
        // Double-click/double-tap zoom is disabled so a single tap can toggle
        // Focus instantly. Keeping both would mean debouncing every tap by the
        // double-click window, making the most-used gesture feel laggy. Zoom is
        // still available via the toolbar buttons, scroll wheel and pinch.
        doubleClickMaxStops: 0,
      }}
      rails={{
        visible: !focus,
        top: railsTop,
        bottom: railsBottom,
        onTap: handleImageTap,
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

// Constant so the filmstrip container is never re-created; open/close is a pure
// CSS height transition driven by `picr-thumbnails-collapsed` on the root.
const thumbnailsProps = { position: 'bottom' } as const;

const lightBoxStyles: SlotStyles = {
  root: { fontFamily: theme.fontFamily, zIndex: 200 }, // mantine modals are 200
};

// The photo is shown "contained" (whole image visible, never cropped) while
// still filling the viewport. This deliberately uses BOTH settings, which is why
// they look contradictory at a glance: `imageFit: 'cover'` (on carouselProps
// below) sizes the <img> element to fill the entire slide — dropping YARL's
// default carousel padding that otherwise wastes space, most noticeably on
// mobile — and `objectFit: 'contain'` here then letterboxes the actual photo
// inside that full-size element so nothing is cropped. Don't collapse this to a
// single setting without re-checking mobile padding first.
//
// (No-download protection is unaffected either way: useNoDownloadMediaProps
// puts draggable/onContextMenu/user-select on the <img> itself — there is no
// covering overlay element.)
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

// imageProps is supplied at the call site (it merges in the no-download props),
// so it is excluded here rather than set twice.
const carouselProps: Omit<CarouselSettings, 'imageProps'> = {
  // Stop at the last photo rather than wrapping back to the first — in a client
  // gallery, silently looping makes it unclear you have seen everything.
  finite: true,
  preload: 2,
  imageFit: 'cover' as const, // see carouselImageProps: pairs with objectFit:'contain'
  padding: 0,
  spacing: 0,
};

// The carousel is `finite`, so the ends are dead stops rather than wrapping —
// these have to expose that or a button silently does nothing on the first and
// last slide. Reads YARL's own currentIndex (like LightboxCounter) rather than
// the URL-derived index, which lags by a render during a transition and would
// enable/disable a frame late.
const LightboxNavButtons = ({
  total,
  controllerRef,
}: {
  total: number;
  controllerRef: RefObject<ControllerRef | null>;
}) => {
  const { t } = useTranslation('gallery');
  const { currentIndex } = useLightboxState();
  return (
    <>
      <LightboxIconButton
        icon={<PreviousIcon size="16" />}
        label={t('lightbox.previous')}
        disabled={currentIndex <= 0}
        onClick={() => controllerRef.current?.prev()}
      />
      <LightboxIconButton
        icon={<NextIcon size="16" />}
        label={t('lightbox.next')}
        disabled={currentIndex >= total - 1}
        onClick={() => controllerRef.current?.next()}
      />
    </>
  );
};

// Single source of truth for the slide counter. Reads YARL's own currentIndex
// rather than the URL-derived index so it cannot lag behind during a transition.
const LightboxCounter = ({ total }: { total: number }) => {
  const { t } = useTranslation('gallery');
  const { currentIndex } = useLightboxState();
  return (
    <span
      className="picr-rail-label picr-rail-counter"
      aria-live="polite"
      aria-atomic="true"
      aria-label={t('lightbox.slideCount', {
        index: currentIndex + 1,
        total,
      })}
    >
      {currentIndex + 1} / {total}
    </span>
  );
};

// YARL calls render.buttonClose() with no arguments, so the close action has to
// come from controller context — which is available because the toolbar renders
// inside the Controller.
const LightboxCloseButton = () => {
  const { t } = useTranslation('gallery');
  const { close } = useController();
  return (
    <LightboxIconButton
      icon={<CloseIcon size="16" />}
      label={t('lightbox.close')}
      onClick={close}
    />
  );
};
