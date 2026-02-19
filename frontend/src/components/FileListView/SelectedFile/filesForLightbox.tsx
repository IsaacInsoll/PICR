import { PicrFile } from '../../../../types';
import { Slide } from 'yet-another-react-lightbox';
import { thumbnailSizes } from '../../../helpers/thumbnailSize';
import { ImageSource } from 'yet-another-react-lightbox';
import { thumbnailDimensions } from '@shared/thumbnailDimensions';
import { imageURL } from '../../../helpers/imageURL';

export const filesForLightbox = (files: PicrFile[]): Slide[] => {
  return files.map((file) => {
    const title = file.name ?? '';
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
    } as Slide;
  });
};
