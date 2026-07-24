import { DEFAULT_SERVER_MEDIA_SETTINGS } from './serverMediaSettings.js';

export const thumbnailDimensions = {
  sm: DEFAULT_SERVER_MEDIA_SETTINGS.thumbnailSmallPx, // baby thumbs
  md: DEFAULT_SERVER_MEDIA_SETTINGS.thumbnailMediumPx, // "250px" eg masonry view
  lg: DEFAULT_SERVER_MEDIA_SETTINGS.thumbnailLargePx, // full screen
} as const;
