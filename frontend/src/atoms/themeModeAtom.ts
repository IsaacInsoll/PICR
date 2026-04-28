import { atom } from 'jotai';
import type { Branding } from '@shared/gql/graphql';
import { HeadingFontKey, PrimaryColor, ThemeMode } from '@shared/gql/graphql';
import {
  DEFAULT_BORDER_RADIUS,
  DEFAULT_HEADING_ALIGNMENT,
  DEFAULT_HEADING_FONT_SIZE,
  DEFAULT_SPACING,
  DEFAULT_THUMBNAIL_SIZE,
} from '@shared/branding/galleryPresets';

export const defaultBranding: Branding = {
  id: '',
  folderId: '',
  mode: ThemeMode.Auto,
  primaryColor: PrimaryColor.Blue,
  headingFontKey: HeadingFontKey.Default,
  thumbnailSize: DEFAULT_THUMBNAIL_SIZE,
  thumbnailSpacing: DEFAULT_SPACING,
  thumbnailBorderRadius: DEFAULT_BORDER_RADIUS,
  headingFontSize: DEFAULT_HEADING_FONT_SIZE,
  headingAlignment: DEFAULT_HEADING_ALIGNMENT,
  folders: [],
};

export const themeModeAtom = atom<Branding>(defaultBranding);

export const applyBrandingDefaults = (
  branding?: Partial<Branding> | null,
): Branding => ({
  ...defaultBranding,
  ...branding,
  mode: branding?.mode ?? defaultBranding.mode,
  primaryColor: branding?.primaryColor ?? defaultBranding.primaryColor,
  headingFontKey: branding?.headingFontKey ?? defaultBranding.headingFontKey,
  thumbnailSize: branding?.thumbnailSize ?? defaultBranding.thumbnailSize,
  thumbnailSpacing:
    branding?.thumbnailSpacing ?? defaultBranding.thumbnailSpacing,
  thumbnailBorderRadius:
    branding?.thumbnailBorderRadius ?? defaultBranding.thumbnailBorderRadius,
  headingFontSize: branding?.headingFontSize ?? defaultBranding.headingFontSize,
  headingAlignment:
    branding?.headingAlignment ?? defaultBranding.headingAlignment,
  folders: branding?.folders ?? defaultBranding.folders,
});
