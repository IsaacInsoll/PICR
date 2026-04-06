import { atom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithHash } from 'jotai-location';
import { atomWithHashOptions as opts } from '../helpers/atomWithHashOptions';
import { lightboxControllerRefAtom } from './lightboxControllerRefAtom';
import type { PicrFolder, PicrFile } from '@shared/types/picr';

export type BannerImageCandidate = Pick<
  PicrFile,
  'id' | 'type' | 'folderId' | 'fileHash' | 'isBannerImage'
>;

export type FileViewType = 'info' | 'comments' | undefined;

export const modalTypeAtom = atomWithHash('m', '', opts);

export const closeModalAtom = atom(null, (get, set) => {
  //TODO: clear these from URL bar so it's not modalType=&modalId= sitting there empty
  const lb = get(lightboxControllerRefAtom);
  lb?.current?.focus();
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

export const moveRenameFolderAtom = atom<PicrFolder | null>(null);

export const setBannerImageAtom = atom<BannerImageCandidate | null>(null);

// Tracks the current folder's bannerSize, bannerTextHAlign, bannerTextVAlign so the
// modal can pre-populate the active options. Set by FolderContentsView on folder change.
export const currentFolderBannerSizeAtom = atom<string | null>(null);
export const currentFolderBannerHAlignAtom = atom<string | null>(null);
export const currentFolderBannerVAlignAtom = atom<string | null>(null);

export const useOpenSetBannerImageModal = () => {
  const set = useSetAtom(setBannerImageAtom);
  return (file: BannerImageCandidate) => set(file);
};

export const useCloseSetBannerImageModal = () => {
  const set = useSetAtom(setBannerImageAtom);
  return () => set(null);
};

export const useSetBannerImageFile = () => useAtomValue(setBannerImageAtom);

export const useOpenMoveRenameFolderModal = () => {
  const setFolder = useSetAtom(moveRenameFolderAtom);
  return (folder: PicrFolder) => setFolder(folder);
};

export const useCloseMoveRenameFolderModal = () => {
  const setFolder = useSetAtom(moveRenameFolderAtom);
  return () => setFolder(null);
};
