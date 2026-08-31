import { LEGACY_THUMBNAIL_DIMENSIONS } from './serverMediaSettings.js';

export const thumbnailDimensions = {
  sm: LEGACY_THUMBNAIL_DIMENSIONS.sm, // baby thumbs
  md: LEGACY_THUMBNAIL_DIMENSIONS.md, // "250px" eg masonry view
  lg: LEGACY_THUMBNAIL_DIMENSIONS.lg, // full screen
} as const;
