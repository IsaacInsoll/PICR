import { imageURL } from '../helpers/imageURL';
import { Image, MantineStyleProp, MantineStyleProps } from '@mantine/core';
import File from '../../../backend/models/File';
import { ThumbnailSize } from '../helpers/thumbnailSize';
import { Blurhash } from 'react-blurhash';
import { useState } from 'react';

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
  const [loaded, setLoaded] = useState(false);
  return (
    <picture>
      <source srcSet={imageURL(file, size, '.avif')} type="image/avif" />
      {!loaded ? (
        <Blurhash
          hash={file.blurHash}
          style={{ ...style, cursor: 'pointer' }}
          resolutionX={32}
          resolutionY={32}
          punch={0.5}
        />
      ) : null}
      <Image
        src={imageURL(file, size)}
        fit="contain"
        alt={file.name}
        onLoad={() => {
          setLoaded(true);
          if (onImageLoaded) onImageLoaded(file);
        }}
        onClick={() => {
          if (onClick) onClick(file);
        }}
        style={{ ...style, cursor: 'pointer' }}
        loading="lazy"
      />
    </picture>
  );
};
