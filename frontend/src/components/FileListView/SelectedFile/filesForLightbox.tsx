import type { PicrFile } from '@shared/types/picr';
import { normalizeDisplayName } from '@shared/displayName';
import type {
  GenericSlide,
  ImageSource,
  Slide,
} from 'yet-another-react-lightbox';
import { thumbnailSizes } from '@shared/thumbnailSize';
import { imageURL } from '../../../helpers/imageURL';
import { isBrowserDisplayableOriginal } from '@shared/imageFormats';
import type { ServerThumbnailDimensions } from '@shared/serverMediaSettings';
import {
  videoPlaybackSource,
  videoPosterURL,
} from '../../../helpers/videoPlaybackSource';

export interface PicrVideoSlide extends GenericSlide {
  type: 'picr-video';
  src: string;
  poster: string;
  thumbnail: string;
  duration?: number;
}

declare module 'yet-another-react-lightbox' {
  interface SlideTypes {
    'picr-video': PicrVideoSlide;
  }
}

export const filesForLightbox = (
  files: PicrFile[],
  canDownload: boolean,
  useOriginalsForLightbox: boolean,
  thumbnailDimensions: ServerThumbnailDimensions,
): Slide[] => {
  return files.map((file) => {
    const title = normalizeDisplayName(file.name) ?? '';
    const useOriginal =
      useOriginalsForLightbox &&
      canDownload &&
      isBrowserDisplayableOriginal(file.name ?? '');
    const props =
      file.type === 'Image'
        ? useOriginal
          ? {
              src: imageURL(file, 'raw'),
            }
          : {
              srcSet: thumbnailSizes.map((size): ImageSource => {
                const width = thumbnailDimensions[size];
                const height = width / (file.imageRatio ?? 1);
                return { src: imageURL(file, size), width, height };
              }),
              src: imageURL(file, 'lg'),
            }
        : file.type === 'Video'
          ? (() => {
              const poster = videoPosterURL(file);
              return {
                type: 'picr-video',
                src: videoPlaybackSource(file),
                poster,
                thumbnail: poster,
                duration: file.duration ?? undefined,
              };
            })()
          : {
              //TODO: normal file
            };

    return {
      download: canDownload
        ? { url: imageURL(file, 'raw'), filename: file.name ?? title }
        : false,
      alt: title,
      title, //requires caption plugin
      ...props,
    } as Slide;
  });
};

export const isPicrVideoSlide = (slide: Slide): slide is PicrVideoSlide => {
  return 'type' in slide && slide.type === 'picr-video';
};
