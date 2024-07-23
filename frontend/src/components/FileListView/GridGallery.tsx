//https://benhowell.github.io/react-grid-gallery/examples/custom-overlay
// TODO: Could use Skeleton as placeholders before content loads?
import { imageURL } from '../../helpers/imageURL';
import { Gallery } from 'react-grid-gallery';
import { FileListViewStyleComponentProps } from './FolderContentsView';
import { MinimalFile } from '../../../types';
import 'yet-another-react-lightbox/styles.css';
import { useMouse } from '@mantine/hooks';
import { Box } from '@mantine/core';
import { useEffect } from 'react';
import { videoThumbnailPreloader } from '../../helpers/videoThumbnailPreloader';
import { VideoBadge } from './VideoBadge';

export const GridGallery = ({
  files,
  setSelectedFileId,
}: FileListViewStyleComponentProps) => {
  const handleClick = (index: number) => {
    setSelectedFileId(files[index].id);
  };

  return (
    <>
      <Gallery
        images={filesForGallery(files)}
        onClick={handleClick}
        enableImageSelection={false}
        thumbnailImageComponent={GalleryImage}
      />
    </>
  );
};

const filesForGallery = (files: MinimalFile[]) => {
  const size = 250;
  return files.map((file) => ({
    key: file.id,
    src: imageURL(file, 'md'),
    width: size,
    height: size / (file.imageRatio ?? 1),
    file: file,
    //alt,tags,isSelected,caption,
  }));
};

//TODO: props is type ThumbnailImageProps + {file:MinimalFile} but I don't know how to type it
const GalleryImage = (props) => {
  const file: MinimalFile = props.item.file;

  if (file.type == 'Video') {
    return <GalleryVideo {...props} />;
  }
  return <img {...props.imageProps} />;
};

const GalleryVideo = (props) => {
  const { ref, x } = useMouse({ resetOnExit: true });
  const file: MinimalFile = props.item.file;
  const w = props.imageProps.style.width ?? 0;
  const imageProps = props.imageProps;
  useEffect(() => {
    videoThumbnailPreloader(file, 'md');
  }, [file.id]);
  if (w && x) {
    const frame = Math.max(1, Math.round((x / w) * 10));
    imageProps.src = imageURL(file, 'md', frame);
  }
  return (
    <Box style={{ position: 'relative' }}>
      <img {...imageProps} ref={ref} />
      <VideoBadge file={file} />
    </Box>
  );
};
