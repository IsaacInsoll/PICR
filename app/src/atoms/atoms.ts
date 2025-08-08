import { atom } from 'jotai';
import { FileSort } from '@shared/files/sortFiles';

export const fileViewFullscreenAtom = atom(false);

export type SelectedView = 'list' | 'gallery' | 'feed'; // copied from 'frontend' but it might end up evolving?
export const folderViewModeAtom = atom<SelectedView>('list');

export const fileSortAtom = atom<FileSort>({
  direction: 'Asc',
  type: 'Filename',
});
