import { Folder } from '../../../graphql-types';

export type FolderIDandName = Pick<Folder, 'id' | 'name'>;

export const folderCache: {
  [key: string]: Pick<Folder, 'name' | 'heroImage'>;
} = {};

export const addToFolderCache = (folder: Partial<Folder>) => {
  const { id, name, heroImage } = folder;
  if (id && name) folderCache[id] = { ...folderCache[id], name, heroImage };
};
