import type {
  PicrFile,
  PicrFolder as PicrFolderType,
} from '@shared/types/picr';
import { normalizeDisplayName } from '@shared/displayName';
import { BackgroundImage, Box, Button } from '@mantine/core';
import { NavLink } from 'react-router';
import { FileIcon, FolderIcon } from '../PicrIcons';
import { imageURL } from '../helpers/imageURL';
import { useHover } from '@mantine/hooks';
import { useIsDarkMode } from '../hooks/useIsDarkMode';
import type { CSSProperties } from 'react';
// This import doesn't work with vite :/
// import { getInitialsColor } from '@mantine/core/lib/components/Avatar/get-initials-color/get-initials-color';

// "Thumbnail Preview" of a folder so you can see it inline with images.
// Pass `to` for a real link (feed view). Pass neither `to` when the caller wraps
// this in its own anchor (grid tile) - the name then renders as a static span so
// it isn't a nested interactive element.
export const PicrFolder = ({
  folder,
  style,
  to,
  title,
}: {
  folder: PicrFolderType;
} & {
  to?: string;
  style?: CSSProperties;
  title?: string;
}) => {
  const folderName = normalizeDisplayName(folder.name);
  const src =
    folder.heroImage?.__typename === 'Image' ||
    folder.heroImage?.__typename === 'Video'
      ? imageURL(folder.heroImage, 'md')
      : undefined;
  const { hovered, ref } = useHover();

  const dark = useIsDarkMode();
  const buttonProps = {
    title,
    leftSection: <FolderIcon />,
    fullWidth: true,
    variant: 'transparent' as const,
    color: hovered ? 'blue' : dark ? '#ddd' : '#333',
    style: { height: '100%' },
  };
  return (
    <BackgroundImage
      src={src ? src.replace(' ', '%20') : ''}
      radius={0}
      ref={ref}
      style={{ height: '100%', ...style }}
    >
      <Box
        style={{
          height: '100%',
          backdropFilter: hovered ? 'blur(2px)' : 'blur(5px)',
          backgroundColor: dark ? '#2229' : '#ddd9',
        }}
      >
        {to ? (
          <Button component={NavLink} to={to} {...buttonProps}>
            {folderName}
          </Button>
        ) : (
          <Button component="span" {...buttonProps}>
            {folderName}
          </Button>
        )}
      </Box>
    </BackgroundImage>
  );
};

//Similar to `PicrFolder` but different enough that I didn't make it a shared component
export const PicrGenericFile = ({
  file,
  style,
  ...props
}: {
  file: PicrFile;
  onClick?: () => void;
  style?: CSSProperties;
  disabled?: boolean;
  title?: string;
}) => {
  const fileName = normalizeDisplayName(file.name);
  const { hovered, ref } = useHover();

  return (
    <Button
      ref={ref}
      {...props}
      leftSection={<FileIcon />}
      fullWidth
      variant="light"
      color={hovered ? 'blue' : 'gray'}
      style={{ height: '100%', ...style }}
    >
      {fileName}
    </Button>
  );
};
