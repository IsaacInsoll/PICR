import { serverInfoType } from '../types/serverInfoType.js';
import { requireFullAdmin } from './admins.js';
import fastFolderSizeSync from 'fast-folder-size/sync.js';
import { picrConfig } from '../../config/picrConfig.js';
import { GraphQLFieldResolver } from 'graphql/type/index.js';
import { ServerInfo } from '../../../graphql-types.js';
import { PicrRequestContext } from '../../types/PicrRequestContext.js';
import { valid } from 'semver';

const resolver: GraphQLFieldResolver<any, PicrRequestContext> = async (
  _,
  _params,
  context,
) => {
  await requireFullAdmin(context);

  const latest = await getLatestBuild();

  return {
    version: picrConfig.version,
    latest,
    databaseUrl: picrConfig.databaseUrl,
    usePolling: picrConfig.usePolling,
    dev: picrConfig.dev,
    canWrite: picrConfig.canWrite,
    //these are functions because they can be potentially SUPER EXPENSIVE
    cacheSize: () => folderSize(picrConfig.cachePath),
    mediaSize: () => folderSize(picrConfig.mediaPath),
    host: picrConfig.baseUrl,
  };
};

export const serverInfo = {
  type: serverInfoType,
  resolve: resolver,
};

const getLatestBuild = async () => {
  const req = await fetch(
    'https://api.github.com/repos/isaacinsoll/picr/releases',
  );
  const json = (await req.json()) as { tag_name: string }[];
  if (Array.isArray(json)) {
    return json[0]?.tag_name ?? '';
  } else {
    return '';
  }
};

// This can be slow if it's a large folder
const folderSize = async (path: string) => {
  // console.log('getting size for ', path);
  // await delay(2000);
  return fastFolderSizeSync(path);
};
