import path from 'path';

export const directoryPath = path.join(process.cwd(), 'media');

// BASIC PATH FUNCTIONS
export const relativePath = (path: string) =>
  path.replace(directoryPath, '').replace(/^\//, '');
export const fullPath = (relativePath: string) => {
    if(relativePath == '') return directoryPath;
    return directoryPath + '/' + relativePath;
};
export const pathSplit = (path: string) => relativePath(path).split('/');

export const folderList = {}; //relativePath to ID mapping
