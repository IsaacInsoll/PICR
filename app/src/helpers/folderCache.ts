import { File, Folder } from '../../../graphql-types';

export type FolderIDandName = Pick<Folder, 'id' | 'name' | 'title'>;
export type FileIDandName = Pick<File, 'id' | 'name' | 'folderId'>;

export const folderCache: {
  [key: string]: Pick<Folder, 'name' | 'title' | 'heroImage'>;
} = {};

export const addToFolderCache = (folder: Partial<Folder>) => {
  const { id, name, title, heroImage } = folder;
  if (id && name)
    folderCache[id] = { ...folderCache[id], name, title, heroImage };
};
export const fileCache: {
  [key: string]: Partial<Pick<File, 'name' | 'fileHash'>>;
} = {};

export const addToFileCache = (file: Partial<File>) => {
  const { id, name, fileHash } = file;
  if (!id) return;
  if (name) fileCache[id] = { ...fileCache[id], name };
  if (fileHash) fileCache[id] = { ...fileCache[id], fileHash };
};
