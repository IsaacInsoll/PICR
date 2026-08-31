import { THUMBNAIL_JPEG_QUALITY } from './thumbnailVariants.js';

export const DEFAULT_SERVER_MEDIA_SETTINGS = {
  useOriginalsForLightbox: false,
  thumbnailJpegQuality: THUMBNAIL_JPEG_QUALITY,
} as const;

export interface ServerMediaSettings {
  useOriginalsForLightbox: boolean;
  thumbnailJpegQuality: number;
}

export interface ServerThumbnailDimensions {
  sm: number;
  md: number;
  lg: number;
}

export const LEGACY_THUMBNAIL_DIMENSIONS: ServerThumbnailDimensions = {
  sm: 250,
  md: 500,
  lg: 2500,
};

export const serverThumbnailDimensions = (): ServerThumbnailDimensions =>
  LEGACY_THUMBNAIL_DIMENSIONS;
