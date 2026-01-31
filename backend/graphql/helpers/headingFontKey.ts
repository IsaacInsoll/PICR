// Re-export from shared to maintain single source of truth
export {
  normalizeFontKey as normalizeHeadingFontKey,
  isFontKey as isHeadingFontKey,
} from '../../../shared/branding/fontRegistry.js';
export { fontKeys } from '../../../shared/branding/fontRegistry.js';

export const defaultHeadingFontKey = 'default';
