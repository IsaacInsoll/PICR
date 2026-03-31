// Actual CSS pixel values stored in the DB — not indices.
// Preset buttons in the UI write these values directly.
// A future custom number input can write any integer.

export const THUMBNAIL_SIZE_PRESETS = {
  xs: 150,
  sm: 180,
  md: 210,
  lg: 250,
  xl: 300,
} as const;

export const SPACING_PRESETS = {
  xs: 0,
  sm: 2,
  md: 4,
  lg: 8,
  xl: 12,
} as const;

export const BORDER_RADIUS_PRESETS = {
  xs: 0,
  sm: 2,
  md: 4,
  lg: 8,
  xl: 16,
} as const;

export const HEADING_FONT_SIZE_PRESETS = {
  xs: 20,
  sm: 24,
  md: 32,
  lg: 40,
  xl: 56,
} as const;

export type PresetKey = keyof typeof THUMBNAIL_SIZE_PRESETS;

export const DEFAULT_THUMBNAIL_SIZE = THUMBNAIL_SIZE_PRESETS.md;
export const DEFAULT_SPACING = SPACING_PRESETS.sm;
export const DEFAULT_BORDER_RADIUS = BORDER_RADIUS_PRESETS.md;
export const DEFAULT_HEADING_FONT_SIZE = HEADING_FONT_SIZE_PRESETS.md;
export const DEFAULT_HEADING_ALIGNMENT = 'center' as const;

export const BANNER_SIZES = [
  'classic',
  'widescreen',
  'cinematic',
  'full',
] as const;
export type BannerSize = (typeof BANNER_SIZES)[number];
export const DEFAULT_BANNER_SIZE: BannerSize = 'classic';

export const bannerSizeLabels: Record<BannerSize, string> = {
  classic: 'Classic',
  widescreen: 'Widescreen',
  cinematic: 'Cinematic',
  full: 'Full Screen',
};

export const bannerSizeSubtitles: Record<BannerSize, string> = {
  classic: '3:2 ratio',
  widescreen: '16:9 ratio',
  cinematic: '21:9 ratio',
  full: 'Fills your screen',
};

// CSS aspect-ratio values for landscape preview cards in SetBannerImageModal.
// 'full' uses 4/3 (typical monitor) to distinguish it from widescreen (16/9).
export const bannerSizeAspectRatios: Record<BannerSize, string> = {
  classic: '3/2',
  widescreen: '16/9',
  cinematic: '21/9',
  full: '4/3',
};

// Portrait (phone) preview: how much of the phone frame the banner fills (0–100).
// Used in SetBannerImageModal portrait mode preview cards.
export const bannerSizePortraitPercent: Record<BannerSize, number> = {
  classic: 40,
  widescreen: 40,
  cinematic: 35,
  full: 100,
};

/**
 * Returns the preset key whose value matches `value`, or undefined if it's a
 * custom value. A null/undefined value maps to 'md' (the default).
 */
export function matchPreset<T extends Record<string, number>>(
  presets: T,
  value: number | null | undefined,
): keyof T | undefined {
  if (value == null) return 'md' as keyof T;
  const entry = Object.entries(presets).find(([, v]) => v === value);
  return entry ? (entry[0] as keyof T) : undefined;
}
