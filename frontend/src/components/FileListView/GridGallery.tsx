//https://benhowell.github.io/react-grid-gallery/examples/custom-overlay
// TODO: Could use Skeleton as placeholders before content loads?
import { imageURL } from '../../helpers/imageURL';
import { Gallery } from './react-grid-gallery';
import type { FileListViewStyleComponentProps } from './FolderContentsView';
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
}: FileListViewStyleComponentProps) => {
  const setFolder = useSetFolder();
  const orderedItems = items ?? [...folders, ...files];
  const handleClick = (index: number) => {
    const item = orderedItems[index];
    if (!item) return;
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
          width: size,
          height: size / imageRatio,
          file: item,
        };
      }
      return {
        key: 'f' + item.id,
        src: '',
        width: size * 2,
        height: size,
        folder: item,
      };
    },
  );
  return (
    <>
      <Gallery
        // rowHeight={180}
        images={galleryItems}
        onClick={handleClick}
        enableImageSelection={false}
        thumbnailImageComponent={(
          p: ThumbnailImageProps<ImageExtended<GalleryItem>>,
        ) => {
          const title =
            typeof p.imageProps?.title === 'string' ? p.imageProps.title : '';
          const style = p.imageProps?.style;

          if (p.item.folder) {
            return (
              <PicrFolder folder={p.item.folder} title={title} style={style} />
            );
          }

          if (!p.item.file) return null;

          if (p.item.file.type == 'File') {
            return (
              <PicrGenericFile file={p.item.file} title={title} style={style} />
            );
          }

          return <GalleryImage {...p} />;
        }}
      />
    </>
  );
};
const size = 250;

type GalleryImageProps = {
  imageProps: ThumbnailImageComponentImageProps;
  item: { file?: ViewFolderFileWithHero };
};

const GalleryImage = ({ imageProps, item }: GalleryImageProps) => {
  if (!item.file) return null;
  const file: ViewFolderFileWithHero = item.file;
  return <FilePreview file={file} imageProps={imageProps} />;
  // if (file.type == 'Video') {
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
