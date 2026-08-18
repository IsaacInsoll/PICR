import { defineConfig } from 'i18next-cli';

export const dynamicGalleryCatalogPatterns = [
  ['error', 'global', 'reason', '*'],
  ['metadata', '*'],
  ['review', 'approved'],
  ['review', 'none'],
  ['review', 'rejected'],
  ['sort', 'commented'],
  ['sort', 'dateTaken'],
  ['sort', 'filename'],
  ['sort', 'modified'],
  ['sort', 'rating'],
  ['view', 'feed'],
  ['view', 'gallery'],
  ['view', 'list'],
] as const;

export default defineConfig({
  locales: ['en', 'fr'],
  extract: {
    input: ['frontend/src/**/*.{ts,tsx}', 'shared/**/*.{ts,tsx}'],
    ignore: ['**/node_modules/**'],
    output: 'shared/i18n/locales/{{language}}/{{namespace}}.json',
    primaryLanguage: 'en',
    secondaryLanguages: ['fr'],
    defaultNS: 'common',
    fallbackNS: 'common',
    preservePatterns: dynamicGalleryCatalogPatterns.map(
      (path) => `gallery:${path.join('.')}`,
    ),
    removeUnusedKeys: false,
  },
});
