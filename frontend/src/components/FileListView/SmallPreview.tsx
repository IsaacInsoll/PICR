import { MinimalFile, MinimalFolder } from '../../../types';
import { Avatar, Box, MantineStyleProps } from '@mantine/core';
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
    alignItems: 'center',
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

  const iconProps = { size: 24 };
  return (
    <Box style={style}>
      <Avatar
        radius="xs"
        size="md"
        opacity={0.5}
        variant="light"
        name={file.name}
        color="initials"
      >
        {isFolder ? (
          <FolderIcon {...iconProps} />
        ) : file.type == 'Video' ? (
          <VideoIcon {...iconProps} />
        ) : (
          <FileIcon {...iconProps} />
        )}
      </Avatar>
    </Box>
  );
};
