//https://benhowell.github.io/react-grid-gallery/examples/custom-overlay
import { imageURL } from '../../helpers/imageURL';
import { Gallery } from 'react-grid-gallery';
import { FileListViewStyleComponentProps } from './FileListView';
import React from 'react';
import Lightbox from 'yet-another-react-lightbox';
import { MinimalFile } from '../../../types';
import 'yet-another-react-lightbox/styles.css';

export const GridGallery = ({
  files,
  selectedIds,
  setSelectedIds,
}: FileListViewStyleComponentProps) => {
  const selectedImage = selectedIds?.[0];
  const selectedImageIndex = files.findIndex(({ id }) => id === selectedImage);
  console.log(selectedImageIndex);

  const handleClick = (index: number) => setSelectedIds([files[index].id]);

  return (
    <>
      <Gallery
        images={filesForGallery(files)}
        onClick={handleClick}
        enableImageSelection={false}
      />
      <Lightbox
        slides={filesForLightbox(files)}
        open={!!selectedImage}
        index={selectedImageIndex}
        close={() => setSelectedIds([])}
      />
    </>
  );
};

const filesForGallery = (files: MinimalFile[]) => {
  const size = 250;
  return files.map((file) => ({
    src: imageURL(file, 'md'),
    width: size,
    height: size / (file.imageRatio ?? 1),
    //alt,tags,isSelected,caption,
  }));
};

const filesForLightbox = (files: MinimalFile[]) => {
  return files.map((file) => ({ src: imageURL(file, 'lg') }));
};
