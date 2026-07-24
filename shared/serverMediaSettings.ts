export const DEFAULT_SERVER_MEDIA_SETTINGS = {
  avifEnabled: false,
  useOriginalsForLightbox: false,
  thumbnailSmallPx: 250,
  thumbnailMediumPx: 500,
  thumbnailLargePx: 2500,
  thumbnailJpegQuality: 60,
  thumbnailAvifQuality: 45,
} as const;

export interface ServerMediaSettings {
  avifEnabled: boolean;
  useOriginalsForLightbox: boolean;
  thumbnailSmallPx: number;
  thumbnailMediumPx: number;
  thumbnailLargePx: number;
  thumbnailJpegQuality: number;
  thumbnailAvifQuality: number;
}

export interface ServerThumbnailDimensions {
  sm: number;
  md: number;
  lg: number;
}

export const serverThumbnailDimensions = (
  settings: Pick<
    ServerMediaSettings,
    'thumbnailSmallPx' | 'thumbnailMediumPx' | 'thumbnailLargePx'
  >,
): ServerThumbnailDimensions => ({
  sm: settings.thumbnailSmallPx,
  md: settings.thumbnailMediumPx,
  lg: settings.thumbnailLargePx,
});
