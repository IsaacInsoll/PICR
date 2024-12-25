import { atom } from 'jotai';
import { Branding, PrimaryColor, ThemeMode } from '../../../graphql-types';

export const defaultTheme: Branding = {
  id: '',
  mode: ThemeMode.Auto,
  primaryColor: PrimaryColor.Blue,
};

export const themeModeAtom = atom<Branding>(defaultTheme);
