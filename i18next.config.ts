import { defineConfig } from 'i18next-cli';
import type { TranslationNamespace } from './shared/i18n/resources';

type CatalogPath = readonly string[];

export const dynamicCatalogPatterns = {
  common: [],
  gallery: [
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
  ],
  admin: [],
} as const satisfies Record<TranslationNamespace, readonly CatalogPath[]>;

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
    preservePatterns: Object.entries(dynamicCatalogPatterns).flatMap(
      ([namespace, patterns]) =>
        patterns.map((path) => `${namespace}:${path.join('.')}`),
    ),
    removeUnusedKeys: false,
  },
});
