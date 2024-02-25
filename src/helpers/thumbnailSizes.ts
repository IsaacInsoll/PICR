export const thumbnailSizes = ['sm', 'md', 'lg'] as const;
export type ThumbnailSize = (typeof thumbnailSizes)[number];

export const allSizes = [...thumbnailSizes, 'raw'] as const;
export type AllSize = (typeof allSizes)[number];

//TODO: configurable via .env?
export const thumbnailDimensions = {
  sm: 250, // baby thumbs
  md: 1000, //full width thumbs?
  lg: 2500, // full screen on ipad
} as const;
