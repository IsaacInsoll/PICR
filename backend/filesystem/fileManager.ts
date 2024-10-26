import { picrConfig } from '../config/picrConfig';

// BASIC PATH FUNCTIONS
export const relativePath = (path: string) =>
  path.replace(picrConfig.mediaPath, '').replace(/^\//, '');
export const fullPath = (relativePath: string) => {
  if (relativePath == '') return picrConfig.mediaPath;
  return picrConfig.mediaPath + '/' + relativePath;
};
export const pathSplit = (path: string) => relativePath(path).split('/');

export const folderList = {}; //relativePath to ID mapping
