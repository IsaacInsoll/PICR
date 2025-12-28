import { imageURL } from '../helpers/imageURL';
import { Image, MantineStyleProps } from '@mantine/core';
import { ThumbnailSize } from '../helpers/thumbnailSize';
import { Blurhash } from 'react-blurhash';
import { useState } from 'react';
import { MinimalFile } from '../../types';
import { useAvifEnabled } from '../hooks/useMe';

interface PicrImageProps {
  file: MinimalFile;
  size: ThumbnailSize;
  onClick?: (file: MinimalFile) => void;
  onImageLoaded?: (file: MinimalFile) => void;
  style?: MantineStyleProps;
  clickable?: boolean; // for some reason onClick existing doesn't work
}
export const PicrImage = ({
  file,
  size,
  onClick,
  onImageLoaded,
  style,
  clickable,
}: PicrImageProps) => {
  //<Image> is a mantine object that is pretty much an <img> tag
  //<picture> is HTML5 that allows you to specify multiple sources for a child image tag
  const [loaded, setLoaded] = useState(false);
  const avif = useAvifEnabled();
  return (
    <div style={{ ...style, position: 'relative' }}>
      <picture>
        {avif ? (
          <source srcSet={imageURL(file, size, '.avif')} type="image/avif" />
        ) : null}
        <source srcSet={imageURL(file, size)} type="image/jpeg" />
        {!loaded && file.blurHash ? (
          <Blurhash
            hash={file.blurHash}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              opacity: loaded ? 0 : 1,
              transition: 'opacity 160ms ease',
            }}
            resolutionX={32}
            resolutionY={32}
            punch={1}
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
          style={{ ...style, cursor: clickable ? 'pointer' : undefined }}
        />
      </picture>
    </div>
  );
};
