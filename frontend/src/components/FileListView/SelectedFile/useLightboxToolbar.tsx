import { useMemo } from 'react';
import type { ViewFolderFileWithHero } from '@shared/files/sortFiles';
import { LightboxInfoButton } from './LightboxInfoButton';
import { ExitFocusIcon, FocusIcon, ThumbnailsIcon } from '../../../PicrIcons';
import { lightboxPlugins } from './lightboxPlugins';
import type { LightboxThumbnails } from './useLightboxThumbnails';
import {
  LightboxIconButton,
  LightboxToolbarDivider,
} from './LightboxIconButton';
import { LightboxDownloadButton } from './LightboxDownloadButton';
import { useTranslation } from 'react-i18next';

// Assembles the YARL toolbar buttons and the active plugin list.
//
// 'fullscreen' is listed explicitly so it lands in a chosen position. YARL
// plugins inject their own toolbar buttons via addToolbarButton(), which
// *prepends* the button when its key is absent from this array. Note YARL hides
// the fullscreen button entirely when document.fullscreenEnabled is false, which
// is the case on iPhone Safari. Download is our own button, not a plugin one —
// see LightboxDownloadButton.
export const useLightboxToolbar = ({
  files,
  canDownload,
  isMobile,
  thumbnails,
  focus,
  onToggleFocus,
}: {
  files: ViewFolderFileWithHero[];
  canDownload: boolean;
  isMobile: boolean;
  thumbnails: LightboxThumbnails;
  focus: boolean;
  onToggleFocus: () => void;
}) => {
  const { t } = useTranslation('gallery');
  const { visible: thumbnailsVisible, toggle: toggleThumbnails } = thumbnails;

  const buttons = useMemo(() => {
    // Explicit Focus control. Tapping the photo is the shortcut, but a hidden
    // gesture cannot be the only affordance — this is the discoverable route,
    // and the only one that works on video slides (where tapping the media
    // means play/pause, so a video left in Focus would otherwise be a dead end
    // for mouse users too).
    const focusButton = (
      <LightboxIconButton
        key="focus"
        icon={focus ? <ExitFocusIcon size="16" /> : <FocusIcon size="16" />}
        label={focus ? t('lightbox.exitFocus') : t('lightbox.focus')}
        active={focus}
        onClick={onToggleFocus}
      />
    );

    // Grouped left to right: what acts on the file, then how it is magnified,
    // then how it is presented, then the exit. 'zoom' is listed explicitly —
    // without it the Zoom plugin prepends its buttons and they land leftmost,
    // ahead of Download. Mobile drops the zoom group entirely (pinch is the
    // gesture there) but otherwise shows the same buttons: there are few enough
    // that hiding any behind an overflow menu costs a tap to save one slot.
    return [
      ...(canDownload ? [<LightboxDownloadButton key="download" />] : []),
      <LightboxInfoButton files={files} key="InfoButton" />,
      ...(isMobile
        ? []
        : [<LightboxToolbarDivider key="divider-zoom" />, 'zoom']),
      <LightboxToolbarDivider key="divider-view" />,
      <LightboxIconButton
        key="thumbnails-toggle"
        icon={<ThumbnailsIcon size="16" />}
        label={
          thumbnailsVisible
            ? t('lightbox.hideThumbnails')
            : t('lightbox.showThumbnails')
        }
        active={thumbnailsVisible}
        onClick={toggleThumbnails}
      />,
      focusButton,
      'fullscreen',
      <LightboxToolbarDivider key="divider-close" />,
      'close',
    ];
  }, [
    isMobile,
    files,
    thumbnailsVisible,
    toggleThumbnails,
    canDownload,
    focus,
    onToggleFocus,
    t,
  ]);

  // Constant: the plugin list must never change identity, or YARL rebuilds its
  // module tree and remounts every slide. See useLightboxThumbnails.
  return { buttons, plugins: lightboxPlugins };
};
