import { GraphQLError } from 'graphql/error/index.js';
import {
  DEFAULT_SERVER_MEDIA_SETTINGS,
  type ServerMediaSettings,
} from '@shared/serverMediaSettings.js';
import { getServerOptions, type ServerOptionsFields } from '../db/picrDb.js';

export type ServerMediaSettingsPatch = Partial<ServerMediaSettings>;

export const resolveServerMediaSettings = (
  opts: Partial<ServerOptionsFields>,
): ServerMediaSettings => ({
  avifEnabled: opts.avifEnabled ?? DEFAULT_SERVER_MEDIA_SETTINGS.avifEnabled,
  useOriginalsForLightbox:
    opts.useOriginalsForLightbox ??
    DEFAULT_SERVER_MEDIA_SETTINGS.useOriginalsForLightbox,
  thumbnailSmallPx:
    opts.thumbnailSmallPx ?? DEFAULT_SERVER_MEDIA_SETTINGS.thumbnailSmallPx,
  thumbnailMediumPx:
    opts.thumbnailMediumPx ?? DEFAULT_SERVER_MEDIA_SETTINGS.thumbnailMediumPx,
  thumbnailLargePx:
    opts.thumbnailLargePx ?? DEFAULT_SERVER_MEDIA_SETTINGS.thumbnailLargePx,
  thumbnailJpegQuality:
    opts.thumbnailJpegQuality ??
    DEFAULT_SERVER_MEDIA_SETTINGS.thumbnailJpegQuality,
  thumbnailAvifQuality:
    opts.thumbnailAvifQuality ??
    DEFAULT_SERVER_MEDIA_SETTINGS.thumbnailAvifQuality,
});

export const getServerMediaSettings = async (): Promise<ServerMediaSettings> =>
  resolveServerMediaSettings(await getServerOptions());

export const validateServerMediaSettings = (
  settings: ServerMediaSettings,
): ServerMediaSettings => {
  const widthFields = [
    ['Small thumbnail width', settings.thumbnailSmallPx],
    ['Medium thumbnail width', settings.thumbnailMediumPx],
    ['Large thumbnail width', settings.thumbnailLargePx],
  ] as const;

  for (const [label, value] of widthFields) {
    if (!Number.isInteger(value) || value < 16 || value > 20000) {
      throw new GraphQLError(`${label} must be between 16 and 20000 pixels`);
    }
  }

  if (
    !(
      settings.thumbnailSmallPx < settings.thumbnailMediumPx &&
      settings.thumbnailMediumPx < settings.thumbnailLargePx
    )
  ) {
    throw new GraphQLError(
      'Thumbnail widths must increase from small to medium to large',
    );
  }

  validateQuality('JPEG quality', settings.thumbnailJpegQuality);
  validateQuality('AVIF quality', settings.thumbnailAvifQuality);

  return settings;
};

const validateQuality = (label: string, value: number) => {
  if (!Number.isInteger(value) || value < 1 || value > 100) {
    throw new GraphQLError(`${label} must be between 1 and 100`);
  }
};
