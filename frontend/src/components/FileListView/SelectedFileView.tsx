// The "Lightbox" appears when an individual image is selected
import { Lightbox } from 'yet-another-react-lightbox';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import Download from 'yet-another-react-lightbox/plugins/download';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';

import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import { MinimalFile } from '../../../types';
import { imageURL } from '../../helpers/imageURL';
import { FileListViewStyleComponentProps } from './FileListView';
import { thumbnailSizes } from '../../helpers/thumbnailSize';
import { thumbnailDimensions } from '../../helpers/thumbnailDimensions';
import { theme } from '../../App';

export const SelectedFileView = ({
  files,
  selectedFileId,
  setSelectedFileId,
}: FileListViewStyleComponentProps) => {
  const selectedImageIndex = files.findIndex(({ id }) => id === selectedFileId);
  const lightBoxStyles = { root: { fontFamily: theme?.global?.font?.family } };

  return (
    <Lightbox
      plugins={[Captions, Counter, Download, Fullscreen]}
      // captions={{ showToggle: true }} // no point as other UI is still on screen
      counter={{ container: { style: { top: 'unset', bottom: 0 } } }}
      slides={filesForLightbox(files)}
      open={!!selectedFileId}
      index={selectedImageIndex}
      close={() => setSelectedFileId(undefined)}
      styles={lightBoxStyles}
    />
  );
};

const filesForLightbox = (files: MinimalFile[]) => {
  return files.map((file) => {
    const title = file.name;
    const srcSet = thumbnailSizes.map((size) => {
      const width = thumbnailDimensions[size];
      const height = width / (file.imageRatio ?? 1);
      return { src: imageURL(file, size), width, height };
    });

    return {
      src: imageURL(file, 'raw'),
      download: imageURL(file, 'raw'),
      alt: title,
      title, //requires caption plugin
      srcSet,
    };
  });
};
