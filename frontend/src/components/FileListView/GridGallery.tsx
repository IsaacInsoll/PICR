//https://benhowell.github.io/react-grid-gallery/examples/custom-overlay
// TODO: Could use Skeleton as placeholders before content loads?
import {
  Gallery,
  type ImageExtended,
  type Image as GridImage,
  type ThumbnailImageComponentImageProps,
  type ThumbnailImageProps,
} from '@picr/react-grid-gallery';
import { useAtomValue } from 'jotai';
import { themeModeAtom } from '../../atoms/themeModeAtom';
import type { MouseEvent } from 'react';
import { useCallback, useMemo } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import { Box } from '@mantine/core';
import type { FileListViewStyleComponentProps } from './FolderContentsView';
import {
  DEFAULT_BORDER_RADIUS,
  DEFAULT_SPACING,
  DEFAULT_THUMBNAIL_SIZE,
} from '@shared/branding/galleryPresets';
import 'yet-another-react-lightbox/styles.css';
import './GridGallery.css';
import { FilePreview } from './FilePreview';
import { PicrFolder, PicrGenericFile } from '../PicrFolder';
import { useFolderUrl, useSetFolder } from '../../hooks/useSetFolder';
import type {
  FolderContentsItem,
  ViewFolderFileWithHero,
} from '@shared/files/folderContentsViewModel';
import { isFolderContentsFile } from '@shared/files/folderContentsViewModel';
import { useThumbnailVariants } from '../../hooks/useMe';
import { thumbnailUrlForWidth } from '../../helpers/thumbnailVariantImages';

type GalleryItem = GridImage & {
  file?: ViewFolderFileWithHero;
  folder?: FolderContentsItem;
};

export const GridGallery = ({
  files,
  folders,
  items,
  setSelectedFileId,
  width,
}: FileListViewStyleComponentProps) => {
  const setFolder = useSetFolder();
  const folderUrl = useFolderUrl();
  const theme = useAtomValue(themeModeAtom);
  const thumbnailSize = theme.thumbnailSize ?? DEFAULT_THUMBNAIL_SIZE;
  const galleryLayout = theme.galleryLayout ?? 'justified';
  const margin = theme.thumbnailSpacing ?? DEFAULT_SPACING;
  const borderRadius = theme.thumbnailBorderRadius ?? DEFAULT_BORDER_RADIUS;
  const isTabletUp = useMediaQuery('(min-width: 48em)');
  const isDesktopUp = useMediaQuery('(min-width: 75em)');
  const thumbnailVariants = useThumbnailVariants();
  const orderedItems = useMemo(
    () => items || [...folders, ...files],
    [files, folders, items],
  );
  const handleClick = useCallback(
    (
      index: number,
      _galleryItem: GalleryItem,
      event?: MouseEvent<HTMLElement>,
    ) => {
      const item = orderedItems[index];
      // Folder tiles, and image-file tiles, are real <a href>. Let the browser
      // handle modifier/non-left clicks (open in new tab); only intercept a plain
      // left click for in-app navigation. (Middle-click fires auxclick, not
      // click, so it never reaches here.) Non-image files have no href and this
      // preventDefault is a harmless no-op on their <div>.
      if (
        event &&
        (event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.button !== 0)
      ) {
        return;
      }
      event?.preventDefault();
      if (isFolderContentsFile(item)) {
        setSelectedFileId(item.id);
      } else {
        setFolder(item);
      }
    },
    [orderedItems, setFolder, setSelectedFileId],
  );
  const galleryItems: GalleryItem[] = useMemo(
    () =>
      orderedItems.map((item: FolderContentsItem) => {
        if (isFolderContentsFile(item)) {
          const imageRatio =
            'imageRatio' in item && typeof item.imageRatio === 'number'
              ? item.imageRatio
              : 1;
          return {
            key: item.id,
            // Layout metadata only: `thumbnailImageComponent` renders the real
            // image through FilePreview, so this src is never fetched.
            src:
              thumbnailUrlForWidth(item, thumbnailSize, thumbnailVariants) ??
              '',
            width: thumbnailSize,
            height: thumbnailSize / imageRatio,
            file: item,
            // Images are real links; videos/other files keep their plain click.
            href:
              item.type === 'Image'
                ? folderUrl({ id: item.folderId }, item.id)
                : undefined,
          };
        }
        return {
          key: 'f' + item.id,
          src: '',
          width: thumbnailSize * 2,
          height: thumbnailSize,
          folder: item,
          href: folderUrl(item),
        };
      }),
    [orderedItems, thumbnailSize, folderUrl, thumbnailVariants],
  );
  const tileViewportStyle = useCallback(
    (context: { item: ImageExtended<GalleryItem> }) => ({
      width: context.item.viewportWidth,
      height: context.item.scaledHeight,
      overflow: 'hidden',
      borderRadius,
    }),
    [borderRadius],
  );
  const outerPadding = useMemo(() => {
    // Keep this dampened mapping aligned with frontend/AGENTS.md branding notes.
    if (isDesktopUp) return Math.max(20, Math.round(margin * 1.75));
    if (isTabletUp) return Math.max(16, Math.round(margin * 1.5));
    return Math.max(12, Math.round(margin * 1.25));
  }, [isDesktopUp, isTabletUp, margin]);
  const initialContainerWidth = Math.max(0, width - 2 * outerPadding);

  return (
    <Box px={outerPadding} style={{ marginTop: -margin }}>
      <Gallery
        {...(galleryLayout === 'masonry'
          ? { layout: 'masonry' as const, columnWidth: thumbnailSize }
          : { layout: 'justified' as const, rowHeight: thumbnailSize })}
        margin={margin}
        images={galleryItems}
        onClick={handleClick}
        enableImageSelection={false}
        defaultContainerWidth={initialContainerWidth}
        tileViewportStyle={tileViewportStyle}
        thumbnailImageComponent={GalleryThumbnailImage}
      />
    </Box>
  );
};

const GalleryThumbnailImage = (
  props: ThumbnailImageProps<ImageExtended<GalleryItem>>,
) => {
  const { imageProps, item } = props;
  const title = typeof imageProps.title === 'string' ? imageProps.title : '';
  const file = item.file;

  if (item.folder) {
    return <PicrFolder folder={item.folder} title={title} />;
  }

  if (file?.type === 'File') {
    return <PicrGenericFile file={file} title={title} />;
  }

  return <GalleryImage {...props} />;
};

type GalleryImageProps = {
  imageProps: ThumbnailImageComponentImageProps;
  item: { file?: ViewFolderFileWithHero };
};

const GalleryImage = ({ imageProps, item }: GalleryImageProps) => {
  if (!item.file) return null;
  const file: ViewFolderFileWithHero = item.file;
  return <FilePreview file={file} imageProps={imageProps} />;
};
