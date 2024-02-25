export type ThumbnailSize = (typeof thumbnailSizes)[number];
export const thumbnailSizes = ['sm', 'md', 'lg'] as const;

export const allSizes = [...thumbnailSizes, 'raw'] as const;
export type AllSize = (typeof allSizes)[number];
