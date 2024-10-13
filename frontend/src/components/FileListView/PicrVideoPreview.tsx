import { useElementSize, useMouse } from '@mantine/hooks';
import { MinimalFile } from '../../../types';
import { Box, Image } from '@mantine/core';
import { VideoBadge } from './VideoBadge';
import { VideoProgressIndicator } from './VideoProgressIndicator';
import { ThumbnailImageComponentImageProps } from 'react-grid-gallery';
import { CSSProperties } from 'react';
import { imageURL } from '../../helpers/imageURL';

// Video 'scrubber' image preview. Requires either a `style` prop for dimensions or will work it out based on container width
export const PicrVideoPreview = ({
  file,
  style,
  ...imageProps
}: {
  file: MinimalFile;
  style?: CSSProperties;
  imageProps?: ThumbnailImageComponentImageProps;
}) => {
  const { x, ...mouse } = useMouse({ resetOnExit: true });
  const element = useElementSize();

  //Get 'styled' width, otherwise determine based on width of Box
  const w = style?.width ?? element.width;
  const h = style?.height ?? element.width / (file.imageRatio ?? 1);

  let frame = 0; // not mouseover
  if (w && x) {
    frame = Math.max(1, Math.round((x / w) * 10)); // 1-10
  }

  const finalStyle = { ...style, height: undefined, position: 'absolute' };

  if (frame > 0) {
    // +1 because it's not enough otherwise, NFI about absolute positioning
    finalStyle.top = (h + 1) * -(frame - 1);
  }

  return (
    <Box
      style={{ position: 'relative', overflow: 'hidden', height: h }}
      ref={element.ref}
    >
      <Image
        {...imageProps}
        style={finalStyle}
        ref={mouse.ref}
        src={imageURL(file, 'md')}
      />
      <VideoBadge file={file} percent={frame * 10} />
      {frame > 0 ? <VideoProgressIndicator frame={frame} /> : null}
    </Box>
  );
};
