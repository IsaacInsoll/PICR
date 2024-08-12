import { imageURL } from '../helpers/imageURL';
import { Image, MantineStyleProp, MantineStyleProps } from '@mantine/core';
import File from '../../../backend/models/File';
import { ThumbnailSize } from '../helpers/thumbnailSize';

interface PicrImageProps {
  file: File;
  size: ThumbnailSize;
  onClick?: (file: File) => void;
  onImageLoaded?: (file: File) => void;
  style?: MantineStyleProps;
}
export const PicrImage = ({
  file,
  size,
  onClick,
  onImageLoaded,
  style,
}: PicrImageProps) => {
  //<Image> is a mantine object that is pretty much an <img> tag
  //<picture> is HTML5 that allows you to specify multiple sources for a child image tag
  return (
    <picture>
      <source srcSet={imageURL(file, size, '.avif')} type="image/avif" />
      <Image
        src={imageURL(file, size)}
        fit="contain"
        alt={file.name}
        onLoad={() => {
          if (onImageLoaded) onImageLoaded(file);
        }}
        onClick={() => {
          if (onClick) onClick(file);
        }}
        style={{ ...style, cursor: onClick ? 'pointer' : undefined }}
        loading="lazy"
      />
    </picture>
  );
};
