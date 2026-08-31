import { GraphQLError } from 'graphql/error/index.js';
import {
  DEFAULT_SERVER_MEDIA_SETTINGS,
  type ServerMediaSettings,
} from '@shared/serverMediaSettings.js';
import { isThumbnailVariantQuality } from '@shared/thumbnailVariants.js';
import { getServerOptions, type ServerOptionsFields } from '../db/picrDb.js';

export type ServerMediaSettingsPatch = Partial<ServerMediaSettings>;

export const resolveServerMediaSettings = (
  opts: Partial<ServerOptionsFields>,
): ServerMediaSettings => ({
  useOriginalsForLightbox:
    opts.useOriginalsForLightbox ??
    DEFAULT_SERVER_MEDIA_SETTINGS.useOriginalsForLightbox,
  thumbnailJpegQuality:
    opts.thumbnailJpegQuality ??
    DEFAULT_SERVER_MEDIA_SETTINGS.thumbnailJpegQuality,
});

export const getServerMediaSettings = async (): Promise<ServerMediaSettings> =>
  resolveServerMediaSettings(await getServerOptions());

export const validateServerMediaSettings = (
  settings: ServerMediaSettings,
): ServerMediaSettings => {
  if (typeof settings.useOriginalsForLightbox !== 'boolean') {
    throw new GraphQLError('useOriginalsForLightbox must be a boolean');
  }
  if (!isThumbnailVariantQuality(settings.thumbnailJpegQuality)) {
    throw new GraphQLError('thumbnailJpegQuality must be between 1 and 100');
  }

  return settings;
};
