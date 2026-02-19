import { atom } from 'jotai';
import {
  Branding,
  HeadingFontKey,
  PrimaryColor,
  ThemeMode,
} from '../../../graphql-types';

type BrandingInput = Partial<
  Pick<
    Branding,
    | 'id'
    | 'folderId'
    | 'name'
    | 'logoUrl'
    | 'mode'
    | 'primaryColor'
    | 'headingFontKey'
  >
>;

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
  branding?: BrandingInput | null,
): Branding => ({
  ...defaultBranding,
  ...branding,
  headingFontKey: branding?.headingFontKey ?? HeadingFontKey.Default,
});
