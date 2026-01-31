import { atom } from 'jotai';
import { FontKey, normalizeFontKey } from '@shared/branding/fontRegistry';
import { Branding, PrimaryColor, ThemeMode } from '../../../graphql-types';

export type BrandingWithHeadingFont = Branding & {
  headingFontKey?: FontKey | null;
};

export const defaultBranding: BrandingWithHeadingFont = {
  id: '',
  mode: ThemeMode.Auto,
  primaryColor: PrimaryColor.Blue,
  headingFontKey: 'default',
};

export const themeModeAtom = atom<BrandingWithHeadingFont>(defaultBranding);

export const applyBrandingDefaults = (
  branding?: BrandingWithHeadingFont | null,
): BrandingWithHeadingFont => ({
  ...defaultBranding,
  ...branding,
  headingFontKey: normalizeFontKey(branding?.headingFontKey),
});
