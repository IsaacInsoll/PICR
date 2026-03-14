// https://docs.expo.dev/guides/using-eslint/
import { defineConfig } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';
import {
  picrCommonLinterOptions,
  picrCommonPlugins,
  picrCommonRules,
  picrRestrictedImports,
  picrTypeAwareAsyncRules,
  picrTypeScriptRules,
} from '../eslint/picr-eslint.mjs';

export default defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'eslint.config.mjs'],
  },
  {
    linterOptions: picrCommonLinterOptions,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'unused-imports': picrCommonPlugins['unused-imports'],
    },
    rules: {
      ...picrCommonRules,
      ...picrTypeScriptRules,
      ...picrTypeAwareAsyncRules,
      'react/no-array-index-key': 'warn',
      'no-restricted-imports': picrRestrictedImports([
        {
          group: ['../**/frontend/**'],
          message: 'Do not import from frontend. Move shared code to shared/.',
        },
        {
          group: ['../**/backend/**'],
          message: 'Do not import from backend. Move shared code to shared/.',
        },
        {
          group: ['../**/shared/**'],
          message:
            'Do not use relative imports to shared/. Use @shared/* imports instead.',
        },
      ]),
    },
  },
]);
