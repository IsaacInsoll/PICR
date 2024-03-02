// The "Lightbox" appears when an individual image is selected
import Lightbox from 'yet-another-react-lightbox';
import React from 'react';
import { MinimalFile } from '../../../types';
import { imageURL } from '../../helpers/imageURL';
import { FileListViewStyleComponentProps } from './FileListView';

export const SelectedFileView = ({
  files,
  selectedFileId,
  setSelectedFileId,
}: FileListViewStyleComponentProps) => {
  const selectedImageIndex = files.findIndex(({ id }) => id === selectedFileId);
  return (
    <Lightbox
      slides={filesForLightbox(files)}
      open={!!selectedFileId}
      index={selectedImageIndex}
      close={() => setSelectedFileId(undefined)}
    />
  );
};

const filesForLightbox = (files: MinimalFile[]) => {
  return files.map((file) => ({ src: imageURL(file, 'lg') }));
};
