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
