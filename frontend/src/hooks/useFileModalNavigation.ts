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
import { useLocationNavigation } from './useLocationNavigation';

export const useFileModalState = () => parseFileModalHash(useLocation().hash);

export const useOpenFileModal = () => {
  const { navigateLocation } = useLocationNavigation();

  return useCallback(
    (modal: FileModalState) => {
      navigateLocation((current) => buildFileModalNavigation(current, modal));
    },
    [navigateLocation],
  );
};

export const useCloseFileModal = () => {
  const navigate = useNavigate();
  const { getCurrentLocation, navigateLocation } = useLocationNavigation();
  const lightboxControllerRef = useAtomValue(lightboxControllerRefAtom);

  return useCallback(() => {
    lightboxControllerRef?.current?.focus();
    if (wasFileModalOpenedInCurrentDocument(getCurrentLocation().state)) {
      void navigate(-1);
      return;
    }

    navigateLocation((current) => ({
      hash: withFileModalState(current.hash),
      replace: true,
      state: current.state,
    }));
  }, [getCurrentLocation, lightboxControllerRef, navigate, navigateLocation]);
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
