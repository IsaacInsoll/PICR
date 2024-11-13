import { MinimalFile, MinimalFolder } from '../../../types';
import { Box, MantineStyleProps } from '@mantine/core';
import { PicrImage } from '../PicrImage';
import { FileIcon, FolderIcon, VideoIcon } from '../../PicrIcons';

export const SmallPreview = ({
  file,
}: {
  file: MinimalFile | MinimalFolder;
}) => {
  const isFolder = file.__typename == 'Folder';
  const height = 48;
  const style: MantineStyleProps = {
    height,
    display: 'flex',
    justifyContent: 'center',
  };

  if (isFolder && file.heroImage) {
    return (
      <Box style={style}>
        <PicrImage
          file={file.heroImage}
          size="sm"
          style={{ width: height * (file.heroImage.imageRatio ?? 1), height }}
        />
      </Box>
    );
  }
  if (!isFolder && file.type == 'Image') {
    return (
      <Box style={style}>
        <PicrImage
          file={file}
          size="sm"
          style={{ width: height * (file.imageRatio ?? 1), height }}
        />
      </Box>
    );
  }
  return (
    <Box style={style}>
      {isFolder ? (
        <FolderIcon style={{ ...style }} size={24} opacity={0.5} />
      ) : file.type == 'Video' ? (
        <VideoIcon style={{ ...style }} size={24} opacity={0.5} />
      ) : (
        <FileIcon style={{ ...style }} size={24} opacity={0.5} />
      )}
    </Box>
  );
};
