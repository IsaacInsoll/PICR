//https://benhowell.github.io/react-grid-gallery/examples/custom-overlay
// TODO: Could use Skeleton as placeholders before content loads?
import { imageURL } from '../../helpers/imageURL';
import { Gallery } from './react-grid-gallery';
import { FileListViewStyleComponentProps } from './FolderContentsView';
import 'yet-another-react-lightbox/styles.css';
import './GridGallery.css';
import { FilePreview } from './FilePreview';
import { PicrFolder, PicrGenericFile } from '../PicrFolder';
import { useSetFolder } from '../../hooks/useSetFolder';
import {
  FolderContentsItem,
  isFolderContentsFile,
  ViewFolderFileWithHero,
} from '@shared/files/folderContentsViewModel';
import { Image as GridImage } from './react-grid-gallery/types';

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        thumbnailImageComponent={(p: any) => {
          const title =
            typeof p.imageProps?.title === 'string' ? p.imageProps.title : '';
          const style = p.imageProps?.style;

          if (p.item.folder) {
            return <PicrFolder folder={p.item.folder} title={title} style={style} />;
          }

          if (p.item.file.type == 'File') {
            return (
              <PicrGenericFile file={p.item.file} title={title} style={style} />
            );
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return <GalleryImage {...(p as any)} />;
        }}
      />
    </>
  );
};
const size = 250;

type GalleryImageProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  imageProps: any;
  item: { file: ViewFolderFileWithHero };
};

const GalleryImage = ({ imageProps, item }: GalleryImageProps) => {
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
