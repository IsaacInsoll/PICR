export const systemFontFamily =
  '-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji';

export const bodyFontFamily = `Roboto, ${systemFontFamily}`;

const cssFontFamilyName = (family: string): string =>
  family.includes(' ') ? `"${family}"` : family;

export const headingFontFamily = (family: string): string =>
  `${cssFontFamilyName(family)}, Roboto, ${systemFontFamily}`;

export const defaultHeadingFontFamily = headingFontFamily('Signika');
