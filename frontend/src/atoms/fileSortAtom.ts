import { atom } from 'jotai/index';

type FileSortType =
  | 'Filename'
  | 'LastModified'
  | 'RecentlyCommented'
  | 'Rating';
type FileSortDirection = 'Asc' | 'Desc';

export interface FileSort {
  type: FileSortType;
  direction: FileSortDirection;
}

export const fileSortAtom = atom<FileSort>({
  type: 'Filename',
  direction: 'Asc',
});
