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
  const width =
    imageProps && typeof imageProps.style.width === 'number'
      ? imageProps.style.width
      : undefined;
  if (file.type === 'Video') {
    return <PicrVideoPreview file={file} {...imageProps} />;
  }
  return (
    <PicrImage
      {...(imageProps ?? {})}
      file={file}
      targetWidth={width ?? 500}
      clickable={true}
      sizes={width ? `${Math.ceil(width)}px` : undefined}
    />
  );
};
