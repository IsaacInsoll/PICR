import { atom, useSetAtom } from 'jotai/index';
import { MinimalFile } from '../../types';
import { FileViewType } from '../hooks/useSetFolder';

export const modalAtom = atom<{
  file?: MinimalFile;
  mode: FileViewType;
  open: boolean;
}>({
  open: false,
});

export const closeModalAtom = atom(null, (get, set) => {
  set(modalAtom, (a) => ({ ...a, open: false }));
});

const openModalAtom = atom(
  null,
  (get, set, args: { file: MinimalFile; mode: FileViewType }) => {
    set(modalAtom, () => {
      return { ...args, open: true };
    });
  },
);

export const useOpenCommentsModal = () => {
  const open = useSetAtom(openModalAtom);
  return (file: MinimalFile) => open({ mode: 'comments', file });
};

export const useOpenFileInfoModal = () => {
  const open = useSetAtom(openModalAtom);
  return (file: MinimalFile) => open({ mode: 'info', file });
};
