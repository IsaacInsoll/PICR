import { atom } from 'jotai';
import type { FileSort } from '@shared/files/sortFiles';
import type { MobileSelectedView } from '@shared/types/ui';

export const fileViewFullscreenAtom = atom(false);

export type SelectedView = MobileSelectedView;
export const folderViewModeAtom = atom<SelectedView>('list');

export const fileSortAtom = atom<FileSort>({
  direction: 'Asc',
  type: 'Filename',
});
