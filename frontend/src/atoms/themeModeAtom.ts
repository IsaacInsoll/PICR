import { atom } from 'jotai';
import type { Branding } from '@shared/gql/graphql';
import { HeadingFontKey, PrimaryColor, ThemeMode } from '@shared/gql/graphql';

export const defaultBranding: Branding = {
  id: '',
  folderId: '',
  mode: ThemeMode.Auto,
  primaryColor: PrimaryColor.Blue,
  headingFontKey: HeadingFontKey.Default,
  folders: [],
};

export const themeModeAtom = atom<Branding>(defaultBranding);

export const applyBrandingDefaults = (
  branding?: Partial<Branding> | null,
): Branding => ({
  ...defaultBranding,
  ...branding,
  headingFontKey: branding?.headingFontKey ?? HeadingFontKey.Default,
});
