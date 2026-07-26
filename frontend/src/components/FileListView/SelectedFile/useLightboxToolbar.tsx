import { useMemo } from 'react';
import { Thumbnails } from 'yet-another-react-lightbox/plugins';
import type { ViewFolderFileWithHero } from '@shared/files/sortFiles';
import { LightboxInfoButton } from './LightboxInfoButton';
import { ThumbnailsIcon } from '../../../PicrIcons';
import { lightboxPlugins, lightboxPluginsProof } from './lightboxPlugins';
import type { LightboxThumbnails } from './useLightboxThumbnails';

// Assembles the YARL toolbar buttons and the active plugin list. Kept out of
// SelectedFileView so the toolbar can grow (overflow menu, extra actions)
// without bloating the component.
export const useLightboxToolbar = ({
  files,
  canDownload,
  isSelectedVideo,
  thumbnails,
}: {
  files: ViewFolderFileWithHero[];
  canDownload: boolean;
  isSelectedVideo: boolean;
  thumbnails: LightboxThumbnails;
}) => {
  const { visible: thumbnailsVisible, toggle: toggleThumbnails } = thumbnails;

  const buttons = useMemo(() => {
    const items = [
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
    files,
    isSelectedVideo,
    thumbnailsVisible,
    toggleThumbnails,
    canDownload,
  ]);

  const plugins = useMemo(
    () =>
      (canDownload ? lightboxPlugins : lightboxPluginsProof).filter(
        (plugin) => thumbnails.mounted || plugin !== Thumbnails,
      ),
    [canDownload, thumbnails.mounted],
  );

  return { buttons, plugins };
};
