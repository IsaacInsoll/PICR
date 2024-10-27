import { serverInfoType } from '../types/serverInfoType';
import { requireFullAdmin } from './admins';
import fastFolderSizeSync from 'fast-folder-size/sync';
import { picrConfig } from '../../config/picrConfig';

const resolver = async (_, params, context, schema) => {
  requireFullAdmin(context);

  return {
    version: picrConfig.version,
    databaseUrl: picrConfig.databaseUrl,
    usePolling: picrConfig.usePolling,
    dev: picrConfig.dev,
    cacheSize: fastFolderSizeSync(picrConfig.cachePath),
    mediaSize: fastFolderSizeSync(picrConfig.mediaPath),
    host: context.host,
  };
};

export const serverInfo = {
  type: serverInfoType,
  resolve: resolver,
};
