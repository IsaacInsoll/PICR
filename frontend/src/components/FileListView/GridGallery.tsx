//https://benhowell.github.io/react-grid-gallery/examples/custom-overlay
// TODO: Could use Skeleton as placeholders before content loads?
import { imageURL } from '../../helpers/imageURL';
import { Gallery, ThumbnailImageProps } from './react-grid-gallery';
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
  const galleryItems = orderedItems.map((item: FolderContentsItem) => {
    if (isFolderContentsFile(item)) {
      return {
        key: item.id,
        src: imageURL(item, 'md'),
        width: size,
        height: size / (item.imageRatio ?? 1),
        file: item,
      };
    }
    return {
      key: 'f' + item.id,
      width: size * 2,
      height: size,
      folder: item,
    };
  });
  return (
    <>
      <Gallery
        // rowHeight={180}
        images={galleryItems}
        onClick={handleClick}
        enableImageSelection={false}
        thumbnailImageComponent={(p) => {
          if (p.item.folder)
            return <PicrFolder folder={p.item.folder} {...p.imageProps} />;

          if (p.item.file.type == 'File')
            return <PicrGenericFile file={p.item.file} {...p.imageProps} />;

          return <GalleryImage {...p} />;
        }}
      />
    </>
  );
};
const size = 250;

type GalleryImageProps = ThumbnailImageProps & {
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
