import { atom } from 'jotai';
import { FileSort } from '@shared/files/sortFiles';

export const fileViewFullscreenAtom = atom(false);

export const fileSortAtom = atom<FileSort>({
  direction: 'Asc',
  type: 'Filename',
});
