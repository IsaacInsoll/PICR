import { picrConfig } from '../config/picrConfig.js';
import { sep } from 'path';
import { FileFields } from '../db/picrDb.js';

// BASIC PATH FUNCTIONS
export const relativePath = (path: string) =>
  path.replace(picrConfig.mediaPath!, '').replace(/^\//, '');
export const fullPath = (relativePath: string) => {
  if (relativePath == '') return picrConfig.mediaPath!;
  return picrConfig.mediaPath + '/' + relativePath;
};
export const pathSplit = (path: string) => relativePath(path).split('/');

export const folderList: { [key: string]: number | undefined } = {}; //relativePath to ID mapping

export const fullPathForFile = (
  f: Pick<FileFields, 'relativePath' | 'name'>,
) => {
  return fullPath(f.relativePath) + sep + f.name;
};

//Gives path relative to another path, useful to remove 'ZIP root folder' when zipping
export const fullPathMinus = (
  f: Pick<FileFields, 'relativePath' | 'name'>,
  path: string,
) => {
  return f.relativePath.replace(path, '') + sep + f.name;
};
