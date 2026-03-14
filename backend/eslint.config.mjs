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
    ignores: ['eslint.config.mjs'],
  },
  {
    linterOptions: picrCommonLinterOptions,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: picrCommonPlugins,
    rules: {
      ...picrCommonRules,
      ...picrTypeScriptRules,
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
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
        {
          group: ['../**/shared/**'],
          message:
            'Import from shared using @shared/* instead of relative paths.',
        },
      ]),
    },
  },
  {
    files: ['shared/gql/**/*.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
);
