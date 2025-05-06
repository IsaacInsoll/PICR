import { serverInfoType } from '../types/serverInfoType.js';
import { requireFullAdmin } from './admins.js';
import fastFolderSizeSync from 'fast-folder-size/sync.js';
import { picrConfig } from '../../config/picrConfig.js';

const resolver = async (_, params, context, schema) => {
  await requireFullAdmin(context);

  const latest = await getLatestBuild();

  return {
    version: picrConfig.version,
    latest,
    databaseUrl: picrConfig.databaseUrl,
    usePolling: picrConfig.usePolling,
    dev: picrConfig.dev,
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
  const req = await fetch('https://api.github.com/repos/isaacinsoll/picr/tags');
  const json = (await req.json()) as { name: string }[];
  // this is a list of releases, the latest is tagged `latest`, the second one is the same build but with a version number
  if (Array.isArray(json)) {
    const version = json.find(({ name }) => name != 'latest');
    return version?.name ?? '';
  } else {
    return json; // this should probably just return empty string, but i want to see what it is
  }
};

// This can be slow if it's a large folder
const folderSize = async (path: string) => {
  // console.log('getting size for ', path);
  // await delay(2000);
  return fastFolderSizeSync(path);
};
