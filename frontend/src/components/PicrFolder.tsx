import { MinimalFolder } from '../../types';
import {
  BackgroundImage,
  Box,
  Button,
  ButtonProps,
  useComputedColorScheme,
} from '@mantine/core';
import { FolderIcon } from '../PicrIcons';
import { imageURL } from '../helpers/imageURL';
import { useHover } from '@mantine/hooks';

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
          backdropFilter: hovered ? 'blur(3px)' : 'blur(8px)',
          backgroundColor: dark ? '#3339' : '#ccc9',
        }}
      >
        <Button
          {...props}
          leftSection={<FolderIcon />}
          fullWidth
          variant="transparent"
          color={hovered ? 'blue' : 'gray'}
        >
          {folder.name}
        </Button>
      </Box>
    </BackgroundImage>
  );
};

const useIsDarkMode = () => {
  const theme = useComputedColorScheme();
  return theme == 'dark';
};
