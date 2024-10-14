import { MinimalFile } from '../../../types';
import { ThumbnailImageComponentImageProps } from 'react-grid-gallery';
import { PicrVideoPreview } from './PicrVideoPreview';
import { PicrImage } from '../PicrImage';

export const FilePreview = ({
  file,
  imageProps,
}: {
  file: MinimalFile;
  imageProps?: ThumbnailImageComponentImageProps;
}) => {
  if (file.type == 'Video') {
    return (
      <PicrVideoPreview file={file} {...imageProps} key={imageProps?.key} />
    );
  }
  console.log(imageProps);
  return (
    <PicrImage
      // style={imageProps.style}
      file={file}
      size="md"
      clickable={true}
      key={imageProps?.key}
      {...imageProps}
    />
  );
};
