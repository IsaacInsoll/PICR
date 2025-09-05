import { MinimalFolder } from '../../types';
import { BackgroundImage, Box, Button, ButtonProps } from '@mantine/core';
import { FileIcon, FolderIcon } from '../PicrIcons';
import { imageURL } from '../helpers/imageURL';
import { useHover } from '@mantine/hooks';
import { useIsDarkMode } from '../hooks/useIsDarkMode';
// This import doesn't work with vite :/
// import { getInitialsColor } from '@mantine/core/lib/components/Avatar/get-initials-color/get-initials-color';

// "Thumbnail Preview" of a folder so you can see it inline with images
export const PicrFolder = ({
  folder,
  ...props
}: {
  folder: MinimalFolder;
} & ButtonProps) => {
  const src = folder.heroImage ? imageURL(folder.heroImage, 'md') : undefined;
  const { hovered, ref } = useHover();

  const dark = useIsDarkMode();
  return (
    <BackgroundImage src={src?.replace(' ', '%20')} radius={0} ref={ref}>
      <Box
        style={{
          backdropFilter: hovered ? 'blur(2px)' : 'blur(5px)',
          backgroundColor: dark ? '#2229' : '#ddd9',
        }}
      >
        <Button
          {...props}
          leftSection={<FolderIcon />}
          fullWidth
          variant="transparent"
          color={hovered ? 'blue' : dark ? '#ddd' : '#333'}
        >
          {folder.name}
        </Button>
      </Box>
    </BackgroundImage>
  );
};

//Similar to `PicrFolder` but different enough that I didn't make it a shared component
export const PicrGenericFile = ({
  file,
  ...props
}: ButtonProps & { file: MinimalFolder }) => {
  const { hovered, ref } = useHover();

  return (
    <Button
      ref={ref}
      {...props}
      leftSection={<FileIcon />}
      fullWidth
      variant="light"
      color={hovered ? 'blue' : 'gray'}
    >
      {file.name}
    </Button>
  );
};
