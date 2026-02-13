import { atom } from 'jotai';
import { normalizeFontKey } from '@shared/branding/fontRegistry';
import {
  Branding,
  HeadingFontKey,
  PrimaryColor,
  ThemeMode,
} from '../../../graphql-types';

export const defaultBranding: Branding = {
  id: '',
  folderId: '',
  mode: ThemeMode.Auto,
  primaryColor: PrimaryColor.Blue,
  headingFontKey: HeadingFontKey.Default,
};

export const themeModeAtom = atom<Branding>(defaultBranding);

export const applyBrandingDefaults = (
  branding?: Branding | null,
): Branding => ({
  ...defaultBranding,
  ...branding,
  headingFontKey:
    normalizeFontKey(branding?.headingFontKey) ?? HeadingFontKey.Default,
});
