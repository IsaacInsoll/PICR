import { atom } from 'jotai/index';
import { RefObject } from 'react';
import { ControllerRef } from 'yet-another-react-lightbox';
import { useAtomValue } from 'jotai';

export const lightboxControllerRefAtom = atom<RefObject<ControllerRef> | null>(
  null,
);

export const useSetLightboxFocus = () => {
  const ref = useAtomValue(lightboxControllerRefAtom);
  return () => {
    const cur = ref?.current;
    if (!cur) {
      console.warn('useSetLightboxFocus called without ref :/');
    } else {
      console.log('set focus on lightbox');
      cur?.focus();
    }
  };
};
