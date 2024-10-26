import { serverInfoType } from '../types/serverInfoType';
import { requireFullAdmin } from './admins';
import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from 'graphql/index';
import fastFolderSizeSync from 'fast-folder-size/sync';
import { picrConfig } from '../../config/picrConfig';

const resolver = async (_, params, context) => {
  requireFullAdmin(context);
  return {
    version: picrConfig.version,
    databaseUrl: picrConfig.databaseUrl,
    usePolling: picrConfig.usePolling,
    dev: picrConfig.dev,
    cacheSize: fastFolderSizeSync(picrConfig.cachePath),
    mediaSize: fastFolderSizeSync(picrConfig.mediaPath),
  };
};

export const serverInfo = {
  type: serverInfoType,
  resolve: resolver,
};
