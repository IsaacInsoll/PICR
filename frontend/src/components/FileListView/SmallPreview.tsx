import { PicrFile, PicrFolder } from '../../../types';
import { Avatar, Box } from '@mantine/core';
import { PicrImage } from '../PicrImage';
import { FileIcon, FolderIcon, VideoIcon } from '../../PicrIcons';
import { CSSProperties } from 'react';

export const SmallPreview = ({
  file,
  height = 48,
}: {
  file: PicrFile | PicrFolder;
  height?: number;
}) => {
  const isFolder = isPicrFolder(file);
  const fileType = !isFolder ? file.type : undefined;
  const style: CSSProperties = {
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
  if (!isFolder && fileType == 'Image') {
    return (
      <Box style={style}>
        <PicrImage
          file={file}
          size="sm"
          style={{
            width: height * ((file.imageRatio as number | null) ?? 1),
            height,
          }}
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
        name={file.name ?? undefined}
        color="initials"
      >
        {isFolder ? (
          <FolderIcon {...iconProps} />
        ) : fileType == 'Video' ? (
          <VideoIcon {...iconProps} />
        ) : (
          <FileIcon {...iconProps} />
        )}
      </Avatar>
    </Box>
  );
};

const isPicrFolder = (file: PicrFile | PicrFolder): file is PicrFolder =>
  !('type' in file);
