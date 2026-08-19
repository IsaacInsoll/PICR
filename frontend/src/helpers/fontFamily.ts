export const systemFontFamily =
  '-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji';

export const bodyFontFamily = `Roboto, ${systemFontFamily}`;

const cssFontFamilyName = (family: string): string =>
  family.includes(' ') ? `"${family}"` : family;

export const headingFontFamily = (family: string): string =>
  `${cssFontFamilyName(family)}, Roboto, ${systemFontFamily}`;

// Keep the family name in sync with defaultBrandingFontFamilyName in
// scripts/generate-fonts.ts. The helper stays import-free so using it does not
// load the generated module's @fontsource CSS side effects.
export const defaultHeadingFontFamily = headingFontFamily('Signika');
