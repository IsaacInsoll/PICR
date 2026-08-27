import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { normalisePicrPingV1Path } from '../../shared/ping/protocol.js';

export const normaliseWirePath = normalisePicrPingV1Path;

const joinWirePath = (prefix: string, path: string) =>
  [prefix, path].filter(Boolean).join('/');

export const mediaPathFor = (
  fullPath: string,
  watchRoot: string,
  pathPrefix: string,
  maxLength = 511,
): string => {
  const resolvedRoot = resolve(watchRoot);
  const resolvedPath = resolve(fullPath);
  const localPath = relative(resolvedRoot, resolvedPath);
  if (
    localPath === '..' ||
    localPath.startsWith(`..${sep}`) ||
    isAbsolute(localPath)
  ) {
    throw new Error(`Watcher path escaped WATCH_ROOT: ${fullPath}`);
  }
  const wireLocalPath = localPath.split(sep).join('/');
  return normaliseWirePath(
    joinWirePath(pathPrefix, wireLocalPath),
    'watcher path',
    maxLength,
  );
};

const parentOf = (path: string) => {
  const parent = dirname(path);
  return parent === '.' ? '' : parent.split(sep).join('/');
};

export type WatchEventName =
  | 'add'
  | 'addDir'
  | 'change'
  | 'unlink'
  | 'unlinkDir';

export type MappedWatchEvent = {
  directories: string[];
  unlinkDerived: boolean;
};

export const directoriesForEvent = (
  event: WatchEventName,
  fullPath: string,
  watchRoot: string,
  pathPrefix: string,
): MappedWatchEvent => {
  const fileEvent = event === 'add' || event === 'change' || event === 'unlink';
  const mediaPath = mediaPathFor(
    fullPath,
    watchRoot,
    pathPrefix,
    fileEvent ? 511 : 255,
  );
  const prefixSegments = pathPrefix ? pathPrefix.split('/') : [];
  const mediaSegments = mediaPath ? mediaPath.split('/') : [];
  const localSegments = mediaSegments.slice(prefixSegments.length);
  const localPath = localSegments.join(sep);
  const localParent = parentOf(localPath);
  const parent = normaliseWirePath(joinWirePath(pathPrefix, localParent));

  switch (event) {
    case 'add':
    case 'change':
      return { directories: [parent], unlinkDerived: false };
    case 'unlink':
      return { directories: [parent], unlinkDerived: true };
    case 'addDir':
      return {
        directories: [...new Set([parent, mediaPath])],
        unlinkDerived: false,
      };
    case 'unlinkDir':
      return { directories: [parent], unlinkDerived: true };
  }
};
