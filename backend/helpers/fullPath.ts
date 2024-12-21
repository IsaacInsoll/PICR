import { sep } from 'path';
import { fileTable } from '../db/models/fileTable';

export const fullPath = (f) => {
  return fullPath(f.relativePath) + sep + f.name;
};

//Gives path relative to another path, useful to remove 'ZIP root folder' when zipping
export const fullPathMinus = (f, path: string) => {
  return f.relativePath.replace(path, '') + sep + f.name;
};
