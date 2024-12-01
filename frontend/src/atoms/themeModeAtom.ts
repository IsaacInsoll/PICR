import { atom } from 'jotai';
import { MantineColorScheme } from '@mantine/core';

export const themeModeAtom = atom<MantineColorScheme>('auto');
