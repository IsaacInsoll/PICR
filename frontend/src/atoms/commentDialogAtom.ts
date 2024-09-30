import { atom } from 'jotai/index';
import { MinimalFile } from '../../types';

export const commentDialogAtom = atom<{ file?: MinimalFile; open: boolean }>({
  open: false,
});
