import { atom } from 'jotai';
import { MantineColorScheme, MantineThemeColors } from '@mantine/core';
import { DefaultMantineColor } from '@mantine/core/lib/core/MantineProvider/theme.types';

export interface IPicrTheme {
  mode: MantineColorScheme;
  primaryColor: DefaultMantineColor;
}

export const defaultTheme: IPicrTheme = {
  mode: 'auto',
  primaryColor: 'blue',
};

export const themeModeAtom = atom<IPicrTheme>(defaultTheme);
