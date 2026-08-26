import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

const unsafeSegment = (segment: string) => segment === '..' || segment === '.';

export const normaliseWirePath = (path: string, label = 'path'): string => {
  if (path === '') return '';
  if (isAbsolute(path) || path.includes('\\') || /\p{Cc}/u.test(path)) {
    throw new Error(`${label} must be a safe relative path`);
  }
  const segments = path.split('/');
  if (segments.some(unsafeSegment)) {
    throw new Error(`${label} must be a safe relative path`);
  }
  if (segments.some((segment) => !segment)) {
    throw new Error(`${label} must be a normalised relative path`);
  }
  const normalised = segments.join('/');
  if (normalised.length > 255) {
    throw new Error(`${label} must be at most 255 characters`);
  }
  return normalised;
};

const joinWirePath = (prefix: string, path: string) =>
  [prefix, path].filter(Boolean).join('/');

export const mediaPathFor = (
  fullPath: string,
  watchRoot: string,
  pathPrefix: string,
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
  return normaliseWirePath(joinWirePath(pathPrefix, wireLocalPath));
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
  const mediaPath = mediaPathFor(fullPath, watchRoot, pathPrefix);
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
