import { atom } from 'jotai';
import { RefObject } from 'react';

export const lightboxRefAtom = atom<RefObject<HTMLDivElement | null> | null>(
  null,
);
