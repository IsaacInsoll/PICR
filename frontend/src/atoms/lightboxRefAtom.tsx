import { atom } from 'jotai/index';
import { RefObject } from 'react';

export const lightboxRefAtom = atom<RefObject<HTMLDivElement> | null>(null);