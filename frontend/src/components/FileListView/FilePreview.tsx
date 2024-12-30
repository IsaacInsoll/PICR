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
  const { key, ...p } = imageProps ?? {};
  return <PicrImage file={file} size="md" clickable={true} key={key} {...p} />;
};
