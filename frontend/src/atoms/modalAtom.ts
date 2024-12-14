import { atom, useSetAtom } from 'jotai/index';
import { MinimalFile } from '../../types';
import { atomWithHash } from 'jotai-location';
import { atomWithHashOptions as opts } from '../helpers/atomWithHashOptions';

export type FileViewType = 'info' | 'comments' | undefined;

export const modalTypeAtom = atomWithHash('m', '', opts);

export const closeModalAtom = atom(null, (get, set) => {
  //TODO: clear these from URL bar so it's not modalType=&modalId= sitting there empty
  set(modalTypeAtom, '');
});

const openModalAtom = atom(
  null,
  (
    get,
    set,
    args: { fileId: string; mode: FileViewType; highlight?: string },
  ) => {
    set(
      modalTypeAtom,
      args.mode +
        (args.fileId
          ? '-' + args.fileId + (args.highlight ? '-' + args.highlight : '')
          : ''),
    );
  },
);

export const useOpenCommentsModal = () => {
  const open = useSetAtom(openModalAtom);
  return (fileId: string, highlight?: string) =>
    open({ mode: 'comments', fileId, highlight });
};

export const useOpenFileInfoModal = () => {
  const open = useSetAtom(openModalAtom);
  return (fileId: string) => open({ mode: 'info', fileId });
};
