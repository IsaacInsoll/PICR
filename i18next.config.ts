import { defineConfig } from 'i18next-cli';

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
    removeUnusedKeys: false,
  },
});
