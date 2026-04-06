//https://benhowell.github.io/react-grid-gallery/examples/custom-overlay
// TODO: Could use Skeleton as placeholders before content loads?
import { imageURL } from '../../helpers/imageURL';
import { Gallery } from './react-grid-gallery';
import { useAtomValue } from 'jotai';
import { themeModeAtom } from '../../atoms/themeModeAtom';
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
  const orderedItems = items || [...folders, ...files];
  const handleClick = (index: number) => {
    const item = orderedItems[index];
    if (isFolderContentsFile(item)) {
      setSelectedFileId(item.id);
    } else {
      setFolder(item);
    }
  };
  const galleryItems: GalleryItem[] = orderedItems.map(
    (item: FolderContentsItem) => {
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
    },
  );
  return (
    <>
      <Gallery
        rowHeight={thumbnailSize}
        margin={margin}
        images={galleryItems}
        onClick={handleClick}
        enableImageSelection={false}
        defaultContainerWidth={width}
        tileViewportStyle={(context) => ({
          width: context.item.viewportWidth,
          height: context.item.scaledHeight,
          overflow: 'hidden',
          borderRadius,
        })}
        thumbnailImageComponent={(
          p: ThumbnailImageProps<ImageExtended<GalleryItem>>,
        ) => {
          const title =
            typeof p.imageProps.title === 'string' ? p.imageProps.title : '';
          const file = p.item.file;

          if (p.item.folder) {
            return <PicrFolder folder={p.item.folder} title={title} />;
          }

          if (file?.type === 'File') {
            return <PicrGenericFile file={file} title={title} />;
          }

          return <GalleryImage {...p} />;
        }}
      />
    </>
  );
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
