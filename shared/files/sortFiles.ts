import type { FilterOptionsInterface } from '@/filterAtom';
import type { ViewFolderQuery } from '@/gql/graphql';
import { DefaultFilterOptions, filterFiles } from './filterFiles';

export type FileSortType =
  | 'Filename'
  | 'LastModified'
  | 'RecentlyCommented'
  | 'Rating';
export type FileSortDirection = 'Asc' | 'Desc';

export interface FileSort {
  type: FileSortType;
  direction: FileSortDirection;
}

type SortableItem = {
  name?: string | null;
  fileLastModified?: string | null;
  folderLastModified?: string | null;
  latestComment?: string | null;
  rating?: number | null;
};

const compareNames = (
  aName: string | null | undefined,
  bName: string | null | undefined,
  direction: FileSortDirection,
) => {
  const positive = direction == 'Asc' ? 1 : -1;
  const a = aName ?? '';
  const b = bName ?? '';
  if (a < b) return -positive;
  if (a > b) return positive;
  return 0;
};

const compareDates = (
  aDate: string | null | undefined,
  bDate: string | null | undefined,
  direction: FileSortDirection,
) => {
  if (!aDate && !bDate) return 0;
  if (!aDate) return 1;
  if (!bDate) return -1;
  const positive = direction == 'Asc' ? 1 : -1;
  if (aDate < bDate) return positive;
  if (aDate > bDate) return -positive;
  return 0;
};

const lastModifiedFor = (item: SortableItem) =>
  item.fileLastModified ?? item.folderLastModified ?? null;

export const sortFiles = <T extends SortableItem>(
  items: T[],
  sort: FileSort,
): T[] => {
  const { type, direction } = sort;
  const positive = direction == 'Asc' ? 1 : -1;
  if (type == 'Filename') {
    return [...items].sort((a, b) => compareNames(a.name, b.name, direction));
  }
  if (type == 'LastModified') {
    return [...items].sort((a, b) =>
      compareDates(lastModifiedFor(a), lastModifiedFor(b), direction),
    );
  }
  if (type == 'RecentlyCommented') {
    return [...items].sort((a, b) =>
      compareDates(a.latestComment, b.latestComment, direction),
    );
  }
  if (type == 'Rating') {
    return [...items].sort((a, b) => {
      const ar = a.rating ?? 0;
      const br = b.rating ?? 0;
      if (ar < br) return positive;
      if (ar > br) return -positive;
      return 0;
    });
  }
  return items;
};

export type ViewFolder = ViewFolderQuery['folder'];
export type ViewFolderFile = ViewFolder['files'][number];
export type ViewFolderSubFolder = ViewFolder['subFolders'][number];
export type ViewFolderFileWithHero = ViewFolderFile & { isHeroImage?: boolean };

export interface SortFolderContentsOptions {
  sort: FileSort;
  filtering?: boolean;
  filters?: FilterOptionsInterface;
  heroImageId?: string | null;
  foldersFirst?: boolean;
}

export interface SortFolderContentsResult {
  folder: ViewFolder;
  files: ViewFolderFileWithHero[];
  folders: ViewFolderSubFolder[];
  items: (ViewFolderSubFolder | ViewFolderFileWithHero)[];
}

const withHeroImageFlag = (
  files: ViewFolderFile[],
  heroImageId?: string | null,
): ViewFolderFileWithHero[] =>
  files.map((file) => ({
    ...file,
    isHeroImage: !!heroImageId && file.id === heroImageId,
  }));

export const sortFolderContents = (
  folder: ViewFolder,
  {
    sort,
    filtering = false,
    filters = DefaultFilterOptions,
    heroImageId,
    foldersFirst = true,
  }: SortFolderContentsOptions,
): SortFolderContentsResult => {
  const filteredFiles = filtering
    ? filterFiles(folder.files, filters)
    : folder.files;
  const sortedFiles = sortFiles(filteredFiles, sort);
  const folderSort =
    sort.type === 'LastModified'
      ? sort
      : { type: 'Filename', direction: sort.direction };
  const sortedFolders = sortFiles(folder.subFolders, folderSort);
  const filesWithHero = withHeroImageFlag(
    sortedFiles,
    heroImageId ?? folder.heroImage?.id,
  );
  const items = foldersFirst
    ? [...sortedFolders, ...filesWithHero]
    : [...filesWithHero, ...sortedFolders];
  const sortedFolder = {
    ...folder,
    subFolders: sortedFolders,
    files: filesWithHero,
  };
  return {
    folder: sortedFolder,
    files: filesWithHero,
    folders: sortedFolders,
    items,
  };
};
