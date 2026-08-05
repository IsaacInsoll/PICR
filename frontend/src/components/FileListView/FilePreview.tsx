import type { PicrFile } from '@shared/types/picr';
import type { ThumbnailImageComponentImageProps } from '@picr/react-grid-gallery';
import { PicrVideoPreview } from './PicrVideoPreview';
import { PicrImage } from '../PicrImage';

export const FilePreview = ({
  file,
  imageProps,
}: {
  file: PicrFile;
  imageProps?: ThumbnailImageComponentImageProps;
}) => {
  if (file.type === 'Video') {
    return <PicrVideoPreview file={file} {...imageProps} />;
  }
  return (
    <PicrImage file={file} size="md" clickable={true} {...(imageProps ?? {})} />
  );
};
