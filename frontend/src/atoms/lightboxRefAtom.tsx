import { atom } from 'jotai';
import type { RefObject } from 'react';

export const lightboxRefAtom = atom<RefObject<HTMLDivElement | null> | null>(
  null,
);
