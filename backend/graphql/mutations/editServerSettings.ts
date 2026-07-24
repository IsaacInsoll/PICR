import {
  GraphQLBoolean,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLNonNull,
} from 'graphql';
import type { ServerMediaSettings } from '@shared/serverMediaSettings.js';
import { serverThumbnailDimensions } from '@shared/serverMediaSettings.js';
import { setServerOptions } from '../../db/picrDb.js';
import type { PicrResolver } from '../helpers/picrResolver.js';
import { requireFullAdmin } from '../queries/admins.js';
import { serverSettingsType } from '../types/serverSettingsType.js';
import {
  getServerMediaSettings,
  validateServerMediaSettings,
} from '../../media/serverMediaSettings.js';

interface EditServerSettingsArgs {
  input: Partial<ServerMediaSettings>;
}

const resolver: PicrResolver<object, EditServerSettingsArgs> = async (
  _,
  params,
  context,
) => {
  await requireFullAdmin(context);

  const current = await getServerMediaSettings();
  const settings = validateServerMediaSettings({
    ...current,
    ...params.input,
  });

  await setServerOptions(settings);
  return {
    ...settings,
    thumbnailDimensions: serverThumbnailDimensions(settings),
  };
};

export const editServerSettingsInputType = new GraphQLInputObjectType({
  name: 'EditServerSettingsInput',
  fields: () => ({
    avifEnabled: { type: GraphQLBoolean },
    useOriginalsForLightbox: { type: GraphQLBoolean },
    thumbnailSmallPx: { type: GraphQLInt },
    thumbnailMediumPx: { type: GraphQLInt },
    thumbnailLargePx: { type: GraphQLInt },
    thumbnailJpegQuality: { type: GraphQLInt },
    thumbnailAvifQuality: { type: GraphQLInt },
  }),
});

export const editServerSettings = {
  type: new GraphQLNonNull(serverSettingsType),
  resolve: resolver,
  args: {
    input: { type: new GraphQLNonNull(editServerSettingsInputType) },
  },
};
