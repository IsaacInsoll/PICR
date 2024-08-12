import { imageURL } from '../helpers/imageURL';
import { Image } from '@mantine/core';
import File from '../../../backend/models/File';
import { ThumbnailSize } from '../helpers/thumbnailSize';
import { i } from 'vite/dist/node/types.d-aGj9QkWt';

interface PicrImageProps {
  file: File;
  size: ThumbnailSize;
  onClick?: (file: File) => void;
  onImageLoaded?: (file: File) => void;
}
export const PicrImage = ({
  file,
  size,
  onClick,
  onImageLoaded,
  ...props
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
        style={{ ...props.style, cursor: onClick ? 'pointer' : undefined }}
      />
    </picture>
  );
};
