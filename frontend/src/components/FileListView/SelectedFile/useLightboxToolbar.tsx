import { useMemo } from 'react';
import {
  Counter,
  Slideshow,
  Thumbnails,
} from 'yet-another-react-lightbox/plugins';
import type { ViewFolderFileWithHero } from '@shared/files/sortFiles';
import { LightboxInfoButton } from './LightboxInfoButton';
import { ThumbnailsIcon } from '../../../PicrIcons';
import { lightboxPlugins, lightboxPluginsProof } from './lightboxPlugins';
import type { LightboxThumbnails } from './useLightboxThumbnails';
import { LightboxOverflowMenu } from './LightboxOverflowMenu';

// Assembles the YARL toolbar buttons and the active plugin list. On narrow
// screens the secondary buttons collapse into an overflow menu (see
// LightboxOverflowMenu). When the rating footer is shown it renders its own
// slide counter, so YARL's standalone Counter plugin is dropped to avoid two.
export const useLightboxToolbar = ({
  files,
  canDownload,
  isSelectedVideo,
  isMobile,
  footerShowsCounter,
  thumbnails,
}: {
  files: ViewFolderFileWithHero[];
  canDownload: boolean;
  isSelectedVideo: boolean;
  isMobile: boolean;
  footerShowsCounter: boolean;
  thumbnails: LightboxThumbnails;
}) => {
  const { visible: thumbnailsVisible, toggle: toggleThumbnails } = thumbnails;

  const buttons = useMemo(() => {
    const items = isMobile
      ? [
          <LightboxOverflowMenu
            key="overflow"
            files={files}
            thumbnails={thumbnails}
          />,
          'close',
        ]
      : [
          <LightboxInfoButton files={files} key="InfoButton" />,
          <button
            key="thumbnails-toggle"
            type="button"
            className="yarl__button"
            onClick={toggleThumbnails}
            aria-pressed={thumbnailsVisible}
            title={thumbnailsVisible ? 'Hide thumbnails' : 'Show thumbnails'}
          >
            <ThumbnailsIcon size="24" />
          </button>,
          ...(isSelectedVideo ? [] : ['slideshow']),
          'close',
        ];
    return canDownload ? ['download', ...items] : items;
  }, [
    isMobile,
    files,
    isSelectedVideo,
    thumbnails,
    thumbnailsVisible,
    toggleThumbnails,
    canDownload,
  ]);

  const plugins = useMemo(
    () =>
      (canDownload ? lightboxPlugins : lightboxPluginsProof).filter(
        (plugin) => {
          if (plugin === Slideshow) return !isMobile;
          if (plugin === Thumbnails) return thumbnails.mounted;
          if (plugin === Counter) return !footerShowsCounter;
          return true;
        },
      ),
    [canDownload, isMobile, thumbnails.mounted, footerShowsCounter],
  );

  return { buttons, plugins };
};
