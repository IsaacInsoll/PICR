import { atom, useAtomValue } from 'jotai';
import type { RefObject } from 'react';
import type { ControllerRef } from 'yet-another-react-lightbox';

export const lightboxControllerRefAtom =
  atom<RefObject<ControllerRef | null> | null>(null);

export const useSetLightboxFocus = () => {
  const ref = useAtomValue(lightboxControllerRefAtom);
  return () => {
    const cur = ref?.current;
    if (cur) {
      cur?.focus();
    }
  };
};
