import { MinimalFile } from '../../../types';
import { ThumbnailImageComponentImageProps } from 'react-grid-gallery';
import { PicrVideoPreview } from './PicrVideoPreview';
import { PicrImage } from '../PicrImage';
import { viewTransitionNameForFile } from '../../helpers/viewTransitions';

export const FilePreview = ({
  file,
  imageProps,
  viewTransitionName,
}: {
  file: MinimalFile;
  imageProps?: ThumbnailImageComponentImageProps;
  viewTransitionName?: string;
}) => {
  if (file.type == 'Video') {
    return (
      <PicrVideoPreview file={file} {...imageProps} key={imageProps?.key} />
    );
  }
  const { key, ...p } = imageProps ?? {};
  const transitionName =
    viewTransitionName ?? viewTransitionNameForFile(file.id);
  return (
    <PicrImage
      file={file}
      size="md"
      clickable={true}
      key={key}
      viewTransitionName={transitionName}
      {...p}
    />
  );
};
