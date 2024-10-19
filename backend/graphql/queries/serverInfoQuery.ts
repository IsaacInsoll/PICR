import { serverInfoType } from '../types/serverInfoType';
import { picrConfig } from '../../server';
import { requireFullAdmin } from './admins';
import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from 'graphql/index';
import fastFolderSizeSync from 'fast-folder-size/sync';

const resolver = async (_, params, context) => {
  requireFullAdmin(context);
  return {
    version: picrConfig.version,
    databaseUrl: picrConfig.databaseUrl,
    usePolling: picrConfig.usePolling,
    dev: picrConfig.dev,
    cacheSize: fastFolderSizeSync(process.cwd() + '/cache'),
    mediaSize: fastFolderSizeSync(process.cwd() + '/media'),
  };
};

export const serverInfo = {
  type: serverInfoType,
  resolve: resolver,
};
