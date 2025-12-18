import { File, Folder } from '../gql/graphql';

export type SearchResultType = 'all' | 'file' | 'folder';

export const buildSearchResultList = (
  files: File[],
  folders: Folder[],
  type: SearchResultType,
): Array<File | Folder> => {
  if (type === 'file') return files;
  if (type === 'folder') return folders;
  return [...folders, ...files];
};

export const getSearchResultMeta = (
  files: File[],
  folders: Folder[],
): {
  totalFiles: number;
  totalFolders: number;
  total: number;
  moreResults: boolean;
} => {
  const totalFiles = files.length;
  const totalFolders = folders.length;
  return {
    totalFiles,
    totalFolders,
    total: totalFiles + totalFolders,
    moreResults: totalFiles === 100 || totalFolders === 100,
  };
};

export const isFolderResult = (
  item: File | Folder,
): item is Folder & { __typename: 'Folder' } =>
  item.__typename === 'Folder';

export const isFileResult = (item: File | Folder): item is File =>
  item.__typename === 'File';

export const formatFolderPath = (folder: Folder) => {
  const parents = folder.parents ?? [];
  const names = parents.map((p) => p?.name).filter(Boolean);
  if (!names.length) return '';
  return [...names, folder.name].join(' / ');
};

export const formatFileFolderName = (file: File) =>
  file.folder?.name ? file.folder.name : '';
