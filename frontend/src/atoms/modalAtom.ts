import { atom, useAtomValue, useSetAtom } from 'jotai';
import type { PicrFolder, PicrFile } from '@shared/types/picr';

export type BannerImageCandidate = Pick<
  PicrFile,
  'id' | 'type' | 'folderId' | 'fileHash' | 'isBannerImage'
>;

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
