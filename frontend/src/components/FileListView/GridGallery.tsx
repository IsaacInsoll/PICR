//https://benhowell.github.io/react-grid-gallery/examples/custom-overlay
// TODO: Could use Skeleton as placeholders before content loads?
import { imageURL } from '../../helpers/imageURL';
import { Gallery, ThumbnailImageProps } from 'react-grid-gallery';
import { FileListViewStyleComponentProps } from './FolderContentsView';
import { MinimalFile } from '../../../types';
import 'yet-another-react-lightbox/styles.css';
import { useMouse } from '@mantine/hooks';
import { Box, Image, Progress } from '@mantine/core';
import { useEffect } from 'react';
import { videoThumbnailPreloader } from '../../helpers/videoThumbnailPreloader';
import { VideoBadge } from './VideoBadge';
import { PicrImage } from '../PicrImage';

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

type GalleryImageProps = ThumbnailImageProps & { item: { file: MinimalFile } };

const GalleryImage = (props: GalleryImageProps) => {
  const file: MinimalFile = props.item.file;

  if (file.type == 'Video') {
    return <GalleryVideo {...props} />;
  }
  return <PicrImage style={props.imageProps.style} file={file} size="md" />;
};

const GalleryVideo = (props) => {
  const { ref, x } = useMouse({ resetOnExit: true });
  const file: MinimalFile = props.item.file;
  const w = props.imageProps.style.width ?? 0;
  const imageProps = props.imageProps;
  useEffect(() => {
    videoThumbnailPreloader(file, 'md');
  }, [file.id]);
  let frame = 0; // not mouseover
  if (w && x) {
    frame = Math.max(1, Math.round((x / w) * 10)); // 1-10
    imageProps.src = imageURL(file, 'md', '.jpg', frame);
  }
  return (
    <Box style={{ position: 'relative' }}>
      <Image {...imageProps} ref={ref} />
      <VideoBadge file={file} percent={frame * 10} />
      {frame > 0 ? (
        <Progress
          color="blue"
          radius="xl"
          size="xs"
          value={frame * 10}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
        />
      ) : null}
    </Box>
  );
};
