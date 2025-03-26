import { atom } from 'jotai';
import { Branding, PrimaryColor, ThemeMode } from '../../../graphql-types';

export const defaultBranding: Branding = {
  id: '',
  mode: ThemeMode.Auto,
  primaryColor: PrimaryColor.Blue,
};

export const themeModeAtom = atom<Branding>(defaultBranding);
