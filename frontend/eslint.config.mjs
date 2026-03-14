import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
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
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
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
    settings: {
      react: { version: 'detect' },
    },
    plugins: {
      ...picrCommonPlugins,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...picrCommonRules,
      ...picrTypeScriptRules,
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      'react/prop-types': 'off',
      'react/destructuring-assignment': ['error', 'always'],
      'react/no-unescaped-entities': 'off',
      'react/no-array-index-key': 'warn',
      'no-restricted-imports': picrRestrictedImports([
        {
          group: ['../**/backend/**'],
          message: 'Do not import from backend. Move shared code to shared/.',
        },
        {
          group: ['../**/app/**'],
          message: 'Do not import from app. Move shared code to shared/.',
        },
        {
          group: ['../**/shared/**'],
          message:
            'Do not use relative imports to shared/. Use @shared/* imports instead.',
        },
        {
          group: [
            '../types',
            '../types.*',
            '../../types',
            '../../types.*',
            '../../../types',
            '../../../types.*',
            '../../../../types',
            '../../../../types.*',
            '../../../../../types',
            '../../../../../types.*',
          ],
          message:
            'Do not import frontend root types. Use @shared/types/picr or other shared/types modules.',
        },
      ]),
    },
  },
);
