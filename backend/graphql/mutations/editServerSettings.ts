import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLInputObjectType,
  GraphQLNonNull,
} from 'graphql';
import { setServerOptions } from '../../db/picrDb.js';
import type { PicrResolver } from '../helpers/picrResolver.js';
import { requireFullAdmin } from '../queries/admins.js';
import { serverSettingsType } from '../types/serverSettingsType.js';
import {
  getServerMediaSettings,
  validateServerMediaSettings,
} from '../../media/serverMediaSettings.js';

interface EditServerSettingsArgs {
  input: { useOriginalsForLightbox?: boolean; thumbnailJpegQuality?: number };
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
  return settings;
};

export const editServerSettingsInputType = new GraphQLInputObjectType({
  name: 'EditServerSettingsInput',
  fields: () => ({
    useOriginalsForLightbox: { type: GraphQLBoolean },
    thumbnailJpegQuality: { type: GraphQLInt },
  }),
});

export const editServerSettings = {
  type: new GraphQLNonNull(serverSettingsType),
  resolve: resolver,
  args: {
    input: { type: new GraphQLNonNull(editServerSettingsInputType) },
  },
};
