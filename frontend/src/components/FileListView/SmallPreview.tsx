import type { PicrFile, PicrFolder } from '@shared/types/picr';
import { normalizeDisplayName } from '@shared/displayName';
import { Avatar, Box } from '@mantine/core';
import { PicrImage } from '../PicrImage';
import { FileIcon, FolderIcon, VideoIcon } from '../../PicrIcons';
import type { CSSProperties } from 'react';
import { VideoBadge } from './VideoBadge';

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

  if (isFolder && isThumbnailFile(file.heroImage)) {
    return (
      <Box style={style}>
        <PicrImage
          file={file.heroImage}
          targetWidth={Math.ceil(height * (file.heroImage.imageRatio ?? 1))}
          sizes={`${Math.ceil(height * (file.heroImage.imageRatio ?? 1))}px`}
          style={{ width: height * (file.heroImage.imageRatio ?? 1), height }}
        />
      </Box>
    );
  }
  if (!isFolder && fileType === 'Image') {
    return (
      <Box style={style}>
        <PicrImage
          file={file}
          targetWidth={Math.ceil(
            height * ((file.imageRatio as number | null) ?? 1),
          )}
          sizes={`${Math.ceil(height * ((file.imageRatio as number | null) ?? 1))}px`}
          style={{
            width: height * ((file.imageRatio as number | null) ?? 1),
            height,
          }}
        />
      </Box>
    );
  }
  if (!isFolder && fileType === 'Video') {
    return (
      <Box style={{ ...style, position: 'relative', overflow: 'hidden' }}>
        <PicrImage
          file={file}
          targetWidth={Math.ceil(
            height * ((file.imageRatio as number | null) ?? 1),
          )}
          sizes={`${Math.ceil(height * ((file.imageRatio as number | null) ?? 1))}px`}
          style={{
            width: height * ((file.imageRatio as number | null) ?? 1),
            height,
          }}
        />
        <VideoBadge file={file} density="compact" />
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
        name={normalizeDisplayName(file.name) ?? undefined}
        color="initials"
      >
        {isFolder ? (
          <FolderIcon {...iconProps} />
        ) : fileType === 'Video' ? (
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

const isThumbnailFile = (file?: PicrFile | null): file is PicrFile =>
  file?.type === 'Image' || file?.type === 'Video';
