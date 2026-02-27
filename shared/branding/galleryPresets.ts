// Actual CSS pixel values stored in the DB — not indices.
// Preset buttons in the UI write these values directly.
// A future custom number input can write any integer.

export const THUMBNAIL_SIZE_PRESETS = {
  xs: 150,
  sm: 200,
  md: 300,
  lg: 450,
  xl: 600,
} as const;

export const SPACING_PRESETS = {
  xs: 2,
  sm: 6,
  md: 12,
  lg: 20,
  xl: 32,
} as const;

export const BORDER_RADIUS_PRESETS = {
  xs: 0,
  sm: 4,
  md: 8,
  lg: 16,
  xl: 9999, // pill / circle
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
export const DEFAULT_SPACING = SPACING_PRESETS.md;
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
