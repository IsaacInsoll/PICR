export type SearchResultType = 'all' | 'file' | 'folder';

type SearchFolderParent = { name?: string | null } | null | undefined;

export type SearchFolderResult = {
  __typename: 'Folder';
  id: string;
  name: string;
  parents?: SearchFolderParent[] | null;
};

export type SearchFileResult = {
  __typename: string;
  id: string;
  name: string;
  folder?: { name?: string | null } | null;
  type?: string | null;
  flag?: string | null;
  rating?: number | null;
  totalComments?: number | null;
};

export const buildSearchResultList = <
  TFile extends SearchFileResult,
  TFolder extends SearchFolderResult,
>(
  files: TFile[],
  folders: TFolder[],
  type: SearchResultType,
): Array<TFile | TFolder> => {
  if (type === 'file') return files;
  if (type === 'folder') return folders;
  return [...folders, ...files];
};

export const getSearchResultMeta = <
  TFile extends SearchFileResult,
  TFolder extends SearchFolderResult,
>(
  files: TFile[],
  folders: TFolder[],
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

export const isFolderResult = <
  TItem extends SearchFileResult | SearchFolderResult,
>(
  item: TItem,
): item is Extract<TItem, SearchFolderResult> => item.__typename === 'Folder';

export const formatFolderPath = (folder: SearchFolderResult) => {
  const parents = folder.parents ?? [];
  const names = parents.map((p) => p?.name).filter(Boolean);
  if (!names.length) return '';
  return [...names, folder.name].join(' / ');
};

export const formatFileFolderName = (file: SearchFileResult) =>
  file.folder?.name ? file.folder.name : '';
