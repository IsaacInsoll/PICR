//https://benhowell.github.io/react-grid-gallery/examples/custom-overlay
// TODO: Could use Skeleton as placeholders before content loads?
import { imageURL } from '../../helpers/imageURL';
import { Gallery, ThumbnailImageProps } from './react-grid-gallery';
import { FileListViewStyleComponentProps } from './FolderContentsView';
import { MinimalFile } from '../../../types';
import 'yet-another-react-lightbox/styles.css';
import './GridGallery.css';
import { FilePreview } from './FilePreview';
import { PicrFolder } from '../PicrFolder';
import { useSetFolder } from '../../hooks/useSetFolder';

export const GridGallery = ({
  files,
  folders,
  setSelectedFileId,
}: FileListViewStyleComponentProps) => {
  const setFolder = useSetFolder();
  const handleClick = (index: number) => {
    if (index < folders.length) {
      setFolder(folders[index]);
    } else {
      setSelectedFileId(files[index - folders.length].id);
    }
  };
  return (
    <>
      <Gallery
        // rowHeight={180}
        images={[...foldersForGallery(folders), ...filesForGallery(files)]}
        onClick={handleClick}
        enableImageSelection={false}
        thumbnailImageComponent={(p) =>
          p.item.folder ? (
            <PicrFolder folder={p.item.folder} {...p.imageProps} />
          ) : (
            <GalleryImage {...p} />
          )
        }
      />
    </>
  );
};
const size = 250;

const foldersForGallery = (folders: Minimalolder[]) => {
  return folders.map((folder) => ({
    key: 'f' + folder.id,
    width: size * 2,
    height: size,
    folder: folder,
  }));
};

const filesForGallery = (files: MinimalFile[]) => {
  return files.map((file) => ({
    key: file.id,
    src: imageURL(file, 'md'),
    width: size,
    height: size / (file.imageRatio ?? 1),
    file: file,
    //alt,tags,isSelected,caption,
  }));
};

type GalleryImageProps = ThumbnailImageProps & { item: { file: MinimalFile } };

const GalleryImage = ({ imageProps, item }: GalleryImageProps) => {
  const file: MinimalFile = item.file;
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
