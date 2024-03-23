import { atom } from 'jotai';

export const themeModeAtom = atom<'dark' | 'light' | 'auto'>('auto');
