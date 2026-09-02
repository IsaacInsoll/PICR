import { useAtomValue } from 'jotai';
import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { lightboxControllerRefAtom } from '../atoms/lightboxControllerRefAtom';
import {
  buildFileModalNavigation,
  parseFileModalHash,
  wasFileModalOpenedInCurrentDocument,
  withFileModalState,
  type FileModalState,
} from '../helpers/fileModalHash';
import { useHashNavigation } from './useHashNavigation';

export const useFileModalState = () => parseFileModalHash(useLocation().hash);

export const useOpenFileModal = () => {
  const { navigateHash } = useHashNavigation();

  return useCallback(
    (modal: FileModalState) => {
      navigateHash((current) => buildFileModalNavigation(current, modal));
    },
    [navigateHash],
  );
};

export const useCloseFileModal = () => {
  const navigate = useNavigate();
  const { getCurrentLocation, navigateHash } = useHashNavigation();
  const lightboxControllerRef = useAtomValue(lightboxControllerRefAtom);

  return useCallback(() => {
    lightboxControllerRef?.current?.focus();
    if (wasFileModalOpenedInCurrentDocument(getCurrentLocation().state)) {
      void navigate(-1);
      return;
    }

    navigateHash((current) => ({
      hash: withFileModalState(current.hash),
      replace: true,
      state: current.state,
    }));
  }, [getCurrentLocation, lightboxControllerRef, navigate, navigateHash]);
};

export const useOpenCommentsModal = () => {
  const open = useOpenFileModal();
  return useCallback(
    (fileId: string, highlight?: string) =>
      open({ mode: 'comments', fileId, highlight }),
    [open],
  );
};

export const useOpenFileInfoModal = () => {
  const open = useOpenFileModal();
  return useCallback(
    (fileId: string) => open({ mode: 'info', fileId }),
    [open],
  );
};
