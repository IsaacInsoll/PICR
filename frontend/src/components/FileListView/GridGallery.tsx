//https://benhowell.github.io/react-grid-gallery/examples/custom-overlay
// TODO: Could use Skeleton as placeholders before content loads?
import { imageURL } from '../../helpers/imageURL';
import { Gallery } from 'react-grid-gallery';
import { FileListViewStyleComponentProps } from './FolderContentsView';
import React from 'react';
import { MinimalFile } from '../../../types';
import 'yet-another-react-lightbox/styles.css';

export const GridGallery = ({
  files,
  setSelectedFileId,
}: FileListViewStyleComponentProps) => {
  const handleClick = (index: number) => {
    setSelectedFileId(files[index].id);
  };

  return (
    <>
      <Gallery
        images={filesForGallery(files)}
        onClick={handleClick}
        enableImageSelection={false}
      />
    </>
  );
};

const filesForGallery = (files: MinimalFile[]) => {
  const size = 250;
  return files.map((file) => ({
    key: file.id,
    src: imageURL(file, 'md'),
    width: size,
    height: size / (file.imageRatio ?? 1),
    //alt,tags,isSelected,caption,
  }));
};
