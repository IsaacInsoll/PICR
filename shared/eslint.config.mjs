import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import {
  picrCommonLinterOptions,
  picrCommonPlugins,
  picrCommonRules,
  picrRestrictedImports,
  picrTypeScriptRules,
} from '../eslint/picr-eslint.mjs';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    linterOptions: picrCommonLinterOptions,
    plugins: picrCommonPlugins,
    rules: {
      ...picrCommonRules,
      ...picrTypeScriptRules,
      'no-restricted-imports': picrRestrictedImports([
        {
          group: ['../**/frontend/**'],
          message: 'Do not import from frontend. Move shared code to shared/.',
        },
        {
          group: ['../**/app/**'],
          message: 'Do not import from app. Move shared code to shared/.',
        },
        {
          group: ['../**/backend/**'],
          message: 'Do not import from backend. Move shared code to shared/.',
        },
      ]),
    },
  },
  {
    files: ['gql/**/*.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
);
