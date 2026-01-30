import {
  HeadingFontKey,
  headingFontKeyOptions,
} from '../types/headingFontKeyOptions.js';

const headingFontKeySet = new Set<string>(headingFontKeyOptions);

export const defaultHeadingFontKey: HeadingFontKey = 'default';

export const normalizeHeadingFontKey = (
  value?: string | null,
): HeadingFontKey => {
  if (value && headingFontKeySet.has(value)) {
    return value as HeadingFontKey;
  }
  return defaultHeadingFontKey;
};

export const isHeadingFontKey = (
  value?: string | null,
): value is HeadingFontKey => {
  if (!value) return false;
  return headingFontKeySet.has(value);
};
