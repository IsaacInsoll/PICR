//https://benhowell.github.io/react-grid-gallery/examples/custom-overlay
import { imageURL } from '../../helpers/imageURL';
import { Gallery } from 'react-grid-gallery';
import { FileListViewProps } from './FileListView';

export const GridGallery = ({ files }: FileListViewProps) => {
  const size = 250;

  const images = files.map((file) => ({
    src: imageURL(file, 'sm'),
    width: size,
    height: size / (file.imageRatio ?? 1),
    //alt,tags,isSelected,caption,
  }));

  return <Gallery images={images} />;
};
