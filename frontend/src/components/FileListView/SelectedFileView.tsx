// The "Lightbox" appears when an individual image is selected
import { ControllerRef, Lightbox, Slide } from 'yet-another-react-lightbox';
import {
  Captions,
  Counter,
  Download,
  Fullscreen,
  Slideshow,
  Thumbnails,
  Video,
} from 'yet-another-react-lightbox/plugins';

import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';

import { MinimalFile } from '../../../types';
import { imageURL } from '../../helpers/imageURL';
import { FileListViewStyleComponentProps } from './FolderContentsView';
import { thumbnailSizes } from '../../helpers/thumbnailSize';
import { thumbnailDimensions } from '../../helpers/thumbnailDimensions';
import { theme } from '../../theme';
import { ImageSource } from 'yet-another-react-lightbox/dist/types';
import { TbInfoCircle } from 'react-icons/tb';
import { useSetFolder } from '../../hooks/useSetFolder';
import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Paper, Portal } from '@mantine/core';
import { FileRating } from './FileRating';

export const SelectedFileView = ({
  files,
  selectedFileId,
  setSelectedFileId,
  folderId,
}: FileListViewStyleComponentProps) => {
  const selectedImageIndex = files.findIndex(({ id }) => id === selectedFileId);
  const selectedImage = files.find(({ id }) => id === selectedFileId);
  const ref = useRef<ControllerRef>(null);
  const { fileId, fileView } = useParams();

  // set focus to Lightbox if there isn't a popup sub-view
  // EG: when closing metadata popup this will reallow left/right keyboard keys to change slides
  useEffect(() => {
    if (!fileView) {
      console.log('set focus on lightbox');
      ref.current?.focus();
    }
  }, [fileView, ref.current]);

  const lightBoxStyles = {
    root: { fontFamily: theme.fontFamily, zIndex: 100 },
  };
  const setFolder = useSetFolder();

  return (
    <Lightbox
      controller={{ ref }}
      plugins={[
        Captions,
        Counter,
        Download,
        Fullscreen,
        Slideshow,
        Thumbnails,
        Video,
      ]}
      // captions={{ showToggle: true }} // no point as other UI is still on screen
      counter={{ container: { style: { top: 'unset', bottom: 0 } } }}
      slides={filesForLightbox(files)}
      open={!!selectedFileId}
      index={selectedImageIndex}
      close={() => setSelectedFileId(undefined)}
      styles={lightBoxStyles}
      video={{ autoPlay: true, muted: false }}
      toolbar={{
        buttons: [
          'download',
          <button
            key="my-button"
            type="button"
            className="yarl__button"
            onClick={() => {
              setFolder({ id: folderId }, selectedImage, 'info');
            }}
          >
            <TbInfoCircle size="28" />
          </button>,
          'slideshow',
          'close',
        ],
      }}
      render={{
        slideFooter: ({ slide }) => (
          <LightboxFileRating slide={slide} selected={selectedImage} />
        ),
      }}
      thumbnails={{ position: 'bottom' }}
      on={{
        view: ({ index }) => {
          const f = files[index];
          // don't change URL if we are already on that URL (IE: first opening gallery)
          if (f.id != fileId) {
            setFolder({ id: folderId }, f);
          }
        },
      }}
    />
  );
};

const filesForLightbox = (files: MinimalFile[]): Slide[] => {
  return files.map((file) => {
    const title = file.name;
    const props =
      file.type == 'Image'
        ? {
            srcSet: thumbnailSizes.map((size): ImageSource => {
              const width = thumbnailDimensions[size];
              const height = width / (file.imageRatio ?? 1);
              return { src: imageURL(file, size), width, height };
            }),
            src: imageURL(file, 'raw'),
          }
        : file.type == 'Video'
          ? {
              type: 'video',
              poster: undefined, //todo: poster
              sources: [{ src: imageURL(file, 'raw'), type: 'video/mp4' }], //TODO: generate multiple bitrates of video for different sizes
            }
          : {
              //TODO: normal file
            };

    return {
      download: imageURL(file, 'raw'),
      alt: title,
      title, //requires caption plugin
      ...props,
    };
  });
};

const LightboxFileRating = ({ selected }: { selected: MinimalFile }) => {
  console.log(selected);
  return (
    <Paper style={{ position: 'absolute', bottom: 0 }} p="xs">
      <FileRating file={selected} />
    </Paper>
  );
};
