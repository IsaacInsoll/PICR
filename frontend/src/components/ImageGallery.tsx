import { File } from '../gql/graphql';
import { MinimalFile } from '../../types';

export const ImageGallery = ({ images }: { images: MinimalFile[] }) => {
  return <h1>Gallery with {images.length} images</h1>;
};
