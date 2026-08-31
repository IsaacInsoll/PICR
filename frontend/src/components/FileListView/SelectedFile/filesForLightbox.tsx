import type { PicrFile } from '@shared/types/picr';
import { normalizeDisplayName } from '@shared/displayName';
import type {
  GenericSlide,
  ImageSource,
  Slide,
} from 'yet-another-react-lightbox';
import { imageURL } from '../../../helpers/imageURL';
import { isBrowserDisplayableOriginal } from '@shared/imageFormats';
import {
  videoPlaybackSource,
  videoPosterURL,
} from '../../../helpers/videoPlaybackSource';
import type { ThumbnailVariantFragmentFragment } from '@shared/gql/graphql';
import {
  sortedThumbnailVariants,
  thumbnailVariantForWidth,
} from '../../../helpers/thumbnailVariantImages';
import type { ThumbnailVariantToken } from '@shared/thumbnailVariants';

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
  // Carry the file's blurhash on image slides so the lightbox can show a
  // blur-up placeholder while the full image loads (see LightboxBlurUp).
  interface SlideImage {
    blurHash?: string | null;
  }
}

export const filesForLightbox = (
  files: PicrFile[],
  canDownload: boolean,
  useOriginalsForLightbox: boolean,
  thumbnailVariants: readonly ThumbnailVariantFragmentFragment[],
): Slide[] => {
  const sortedVariants = sortedThumbnailVariants(thumbnailVariants);
  const largestVariant = sortedVariants.at(-1);
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
              blurHash: file.blurHash,
            }
          : {
              srcSet: sortedVariants.map((variant): ImageSource => {
                const width = variant.width;
                const height = width / (file.imageRatio ?? 1);
                return {
                  src: imageURL(file, variant.token as ThumbnailVariantToken),
                  width,
                  height,
                };
              }),
              src: largestVariant
                ? imageURL(file, largestVariant.token as ThumbnailVariantToken)
                : undefined,
              blurHash: file.blurHash,
            }
        : file.type === 'Video'
          ? (() => {
              const posterVariant = thumbnailVariantForWidth(
                thumbnailVariants,
                2560,
              );
              const poster = videoPosterURL(
                file,
                posterVariant
                  ? (posterVariant.token as ThumbnailVariantToken)
                  : undefined,
              );
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
      title, // shown in the rail, and used as the video player's title
      ...props,
    } as Slide;
  });
};

export const isPicrVideoSlide = (slide: Slide): slide is PicrVideoSlide => {
  return 'type' in slide && slide.type === 'picr-video';
};
