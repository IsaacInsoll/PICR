//https://benhowell.github.io/react-grid-gallery/examples/custom-overlay
// TODO: Could use Skeleton as placeholders before content loads?
import { imageURL } from '../../helpers/imageURL';
import { Gallery } from './react-grid-gallery';
import { useAtomValue } from 'jotai';
import { themeModeAtom } from '../../atoms/themeModeAtom';
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
import { useSetFolder } from '../../hooks/useSetFolder';
import type {
  FolderContentsItem,
  ViewFolderFileWithHero,
} from '@shared/files/folderContentsViewModel';
import { isFolderContentsFile } from '@shared/files/folderContentsViewModel';
import type {
  ImageExtended,
  Image as GridImage,
  ThumbnailImageComponentImageProps,
  ThumbnailImageProps,
} from './react-grid-gallery/types';

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
  const theme = useAtomValue(themeModeAtom);
  const thumbnailSize = theme.thumbnailSize ?? DEFAULT_THUMBNAIL_SIZE;
  const margin = theme.thumbnailSpacing ?? DEFAULT_SPACING;
  const borderRadius = theme.thumbnailBorderRadius ?? DEFAULT_BORDER_RADIUS;
  const isTabletUp = useMediaQuery('(min-width: 48em)');
  const isDesktopUp = useMediaQuery('(min-width: 75em)');
  const orderedItems = useMemo(
    () => items || [...folders, ...files],
    [files, folders, items],
  );
  const handleClick = useCallback(
    (index: number) => {
      const item = orderedItems[index];
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
            src: imageURL(item, 'md'),
            width: thumbnailSize,
            height: thumbnailSize / imageRatio,
            file: item,
          };
        }
        return {
          key: 'f' + item.id,
          src: '',
          width: thumbnailSize * 2,
          height: thumbnailSize,
          folder: item,
        };
      }),
    [orderedItems, thumbnailSize],
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
        rowHeight={thumbnailSize}
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
  // if (file.type === 'Video') {
  //   return <PicrVideoPreview file={file} imageProps={imageProps} />;
  // }
  // return (
  //   <PicrImage
  //     style={imageProps.style}
  //     file={file}
  //     size="md"
  //     clickable={true}
  //   />
  // );
};
